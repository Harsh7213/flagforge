import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createEvaluationLimit, createMonthlyEvaluationLimit } from './evaluationLimits';

class FakeRedisClient {
  private values = new Map<string, number>();

  async eval(_script: string, options: { keys: string[]; arguments: string[] }) {
    if (options.arguments.length === 3) {
      const [weight, limit, resetTime] = options.arguments.map(Number);
      const current = this.values.get(options.keys[0]) ?? 0;
      if (current + weight > limit) return [current, 0, resetTime];

      const total = current + weight;
      this.values.set(options.keys[0], total);
      return [total, 1, resetTime];
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
  100_000,
  'test:quota:evaluate',
  new FakeRedisClient() as never
);

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  Object.assign(req, {
    project: { id: req.get('X-Project-ID') ?? 'default-project', name: 'Test project' }
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

  it('counts batch flags toward a monthly per-project quota and resets each month', async () => {
    const start = new Date('2026-10-31T23:59:00.000Z').getTime();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);
    const quota = createMonthlyEvaluationLimit(5, 'test:weighted-quota', new FakeRedisClient() as never);
    const quotaApp = express();
    quotaApp.use(express.json());
    quotaApp.use((req, _res, next) => {
      Object.assign(req, {
        project: { id: req.get('X-Project-ID') ?? 'default-project', name: 'Test project' }
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
});