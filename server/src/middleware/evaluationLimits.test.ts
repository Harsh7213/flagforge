import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import type {} from './auth';
import { createEvaluationLimit, createMonthlyEvaluationLimit } from './evaluationLimits';

class FakeRedisClient {
  private values = new Map<string, number>();

  async eval(_script: string, options: { keys: string[]; arguments: string[] }) {
    if (options.arguments.length === 4) {
      const [weight, projectLimit, organizationLimit, resetTime] = options.arguments.map(Number);
      const organizationCurrent = this.values.get(options.keys[0]) ?? 0;
      const projectCurrent = this.values.get(options.keys[1]) ?? 0;
      if (organizationCurrent + weight > organizationLimit) {
        return [organizationCurrent, projectCurrent, 0, 1, resetTime];
      }
      if (projectCurrent + weight > projectLimit) {
        return [organizationCurrent, projectCurrent, 1, 0, resetTime];
      }

      const organizationTotal = organizationCurrent + weight;
      const projectTotal = projectCurrent + weight;
      this.values.set(options.keys[0], organizationTotal);
      this.values.set(options.keys[1], projectTotal);
      return [organizationTotal, projectTotal, 1, 1, resetTime];
    }

    if (options.arguments.length === 2) {
      const [duration, now] = options.arguments.map(Number);
      const windowStart = Math.floor(now / duration) * duration;
      const currentKey = options.keys[0];
      const previousKey = options.keys[1];
      const currentCount = (this.values.get(currentKey) ?? 0) + 1;
      const previousCount = this.values.get(previousKey) ?? 0;
      const totalHits = currentCount + previousCount * (1 - (now - windowStart) / duration);

      this.values.set(currentKey, currentCount);
      return [currentCount, totalHits.toFixed(6), windowStart + duration];
    }

    const currentCount = this.values.get(options.keys[0]) ?? 0;
    if (currentCount > 0) this.values.set(options.keys[0], currentCount - 1);
    return currentCount;
  }

  async unlink(keys: string[]) {
    for (const key of keys) this.values.delete(key);
    return keys.length;
  }

  async *scanIterator(options: { MATCH: string }): AsyncGenerator<string[]> {
    const prefix = options.MATCH.slice(0, -1);
    const keys = [...this.values.keys()].filter(key => key.startsWith(prefix));
    if (keys.length > 0) yield keys;
  }
}

const evaluationLimit = createEvaluationLimit(
  60,
  'test:rate-limit:evaluate',
  new FakeRedisClient() as never
);
const batchEvaluationLimit = createEvaluationLimit(
  10,
  'test:rate-limit:batch',
  new FakeRedisClient() as never
);
const monthlyEvaluationLimit = createMonthlyEvaluationLimit(
  10000,
  'test:quota:evaluate',
  new FakeRedisClient() as never
);

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  Object.assign(req, {
    project: {
      id: req.get('X-Project-ID') ?? 'default-project',
      name: 'Test project',
      organizationId: req.get('X-Organization-ID') ?? req.get('X-Project-ID') ?? 'default-project'
    }
  });
  next();
});
app.post('/evaluate', evaluationLimit, monthlyEvaluationLimit, (_req, res) => res.sendStatus(200));
app.post('/evaluate/batch', batchEvaluationLimit, monthlyEvaluationLimit, (_req, res) =>
  res.sendStatus(200)
);

const evaluate = (projectId: string) =>
  request(app).post('/evaluate').set('X-Project-ID', projectId);
const evaluateBatch = (projectId: string) =>
  request(app)
    .post('/evaluate/batch')
    .set('X-Project-ID', projectId)
    .send({ flagKeys: ['flag-a'] });

describe('evaluation rate limits', () => {
  beforeEach(() => {
    evaluationLimit.resetKey('evaluation-project');
    evaluationLimit.resetKey('separate-project');
    evaluationLimit.resetKey('boundary-project');
    batchEvaluationLimit.resetKey('batch-project');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('limits evaluation requests per project and gradually recovers across windows', async () => {
    const start = new Date('2026-01-01T00:00:00.000Z').getTime();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);

    const firstRequest = await evaluate('evaluation-project');
    expect(firstRequest.status).toBe(200);
    expect(firstRequest.headers.ratelimit).toContain('t=60');

    for (let index = 1; index < 60; index += 1) {
      expect((await evaluate('evaluation-project')).status).toBe(200);
    }
    const limited = await evaluate('evaluation-project');
    expect(limited.status).toBe(429);
    expect(limited.body.error).toMatch(/Too many evaluation requests/);

    clock.mockReturnValue(start + 90_000);
    for (let index = 0; index < 29; index += 1) {
      expect((await evaluate('evaluation-project')).status).toBe(200);
    }
    expect((await evaluate('evaluation-project')).status).toBe(429);
    expect((await evaluate('separate-project')).status).toBe(200);
  }, 15_000);

  it('rejects most of a burst immediately after the window boundary', async () => {
    const start = new Date('2026-01-01T00:00:00.000Z').getTime();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);

    for (let index = 0; index < 60; index += 1) {
      expect((await evaluate('boundary-project')).status).toBe(200);
    }
    clock.mockReturnValue(start + 61_000);
    expect((await evaluate('boundary-project')).status).toBe(200);
    expect((await evaluate('boundary-project')).status).toBe(429);
  }, 15_000);

  it('limits batch evaluation requests to 10 per project', async () => {
    for (let index = 0; index < 10; index += 1) {
      expect((await evaluateBatch('batch-project')).status).toBe(200);
    }

    expect((await evaluateBatch('batch-project')).status).toBe(429);
  }, 15_000);

  it('resolves request limits and monthly quotas from the project plan', async () => {
    const planEvaluationLimit = createEvaluationLimit(
      req => (req.project?.plan === 'small' ? 1 : 2),
      'test:plan-rate-limit',
      new FakeRedisClient() as never
    );
    const planMonthlyLimit = createMonthlyEvaluationLimit(
      req => (req.project?.plan === 'small' ? 2 : 4),
      'test:plan-quota',
      new FakeRedisClient() as never,
      req => (req.project?.plan === 'small' ? 5 : 8)
    );
    const planApp = express();
    planApp.use(express.json());
    planApp.use((req, _res, next) => {
      Object.assign(req, {
        project: {
          id: req.get('X-Project-ID') ?? 'default-project',
          name: 'Test project',
          organizationId:
            req.get('X-Organization-ID') ?? req.get('X-Project-ID') ?? 'default-project',
          plan: req.get('X-Project-Plan') ?? 'standard'
        }
      });
      next();
    });
    planApp.post('/evaluate', planEvaluationLimit, planMonthlyLimit, (_req, res) =>
      res.sendStatus(200)
    );

    const evaluateOnPlan = (projectId: string, plan: string) =>
      request(planApp)
        .post('/evaluate')
        .set('X-Project-ID', projectId)
        .set('X-Project-Plan', plan);

    const smallPlanRequest = await evaluateOnPlan('small-project', 'small');
    expect(smallPlanRequest.status).toBe(200);
    expect(smallPlanRequest.headers['x-evaluation-quota-limit']).toBe('2');
    expect((await evaluateOnPlan('small-project', 'small')).status).toBe(429);

    const standardPlanRequest = await evaluateOnPlan('standard-project', 'standard');
    expect(standardPlanRequest.status).toBe(200);
    expect(standardPlanRequest.headers['x-evaluation-quota-limit']).toBe('4');
  });

  it('counts batch flags toward monthly per-project quotas and resets each month', async () => {
    const start = new Date('2026-10-31T23:59:00.000Z').getTime();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);
    const quota = createMonthlyEvaluationLimit(
      5,
      'test:weighted-quota',
      new FakeRedisClient() as never,
      10
    );
    const quotaApp = express();
    quotaApp.use(express.json());
    quotaApp.use((req, _res, next) => {
      Object.assign(req, {
        project: {
          id: req.get('X-Project-ID') ?? 'default-project',
          name: 'Test project',
          organizationId:
            req.get('X-Organization-ID') ?? req.get('X-Project-ID') ?? 'default-project'
        }
      });
      next();
    });
    quotaApp.post('/evaluate', quota, (_req, res) => res.sendStatus(200));

    const evaluateMany = (projectId: string, flagKeys: string[]) =>
      request(quotaApp)
        .post('/evaluate')
        .set('X-Project-ID', projectId)
        .send({ flagKeys });

    const firstBatch = await evaluateMany('quota-project', ['a', 'b', 'c']);
    expect(firstBatch.status).toBe(200);
    expect(firstBatch.headers['x-evaluation-quota-remaining']).toBe('2');
    expect((await evaluateMany('quota-project', ['d', 'e', 'f'])).status).toBe(429);
    expect((await evaluateMany('other-quota-project', ['a'])).status).toBe(200);

    clock.mockReturnValue(new Date('2026-11-01T00:00:00.000Z').getTime());
    expect((await evaluateMany('quota-project', ['d', 'e', 'f'])).status).toBe(200);
  });

  it('enforces a monthly organization quota across projects', async () => {
    const quota = createMonthlyEvaluationLimit(
      100,
      'test:organization-quota',
      new FakeRedisClient() as never,
      5
    );
    const quotaApp = express();
    quotaApp.use(express.json());
    quotaApp.use((req, _res, next) => {
      Object.assign(req, {
        project: {
          id: req.get('X-Project-ID'),
          name: 'Test project',
          organizationId: req.get('X-Organization-ID')
        }
      });
      next();
    });
    quotaApp.post('/evaluate', quota, (_req, res) => res.sendStatus(200));

    const evaluateMany = (projectId: string, flagKeys: string[]) =>
      request(quotaApp)
        .post('/evaluate')
        .set('X-Project-ID', projectId)
        .set('X-Organization-ID', 'shared-organization')
        .send({ flagKeys });

    const firstBatch = await evaluateMany('project-one', ['a', 'b', 'c']);
    expect(firstBatch.status).toBe(200);
    expect(firstBatch.headers['x-organization-evaluation-quota-remaining']).toBe('2');

    const secondBatch = await evaluateMany('project-two', ['d', 'e', 'f']);
    expect(secondBatch.status).toBe(429);
    expect(secondBatch.body.error).toMatch(/Organization monthly evaluation quota/);
  });
});