import rateLimit, { type Store } from 'express-rate-limit';
import type { Request, RequestHandler } from 'express';
import redisClient from '../db/redis';
import { getProjectPlanEntitlements } from '../plans';

const projectKey = (req: Request) => req.project!.id;
const windowMs = 60 * 1000;
const monthlyQuotaScript = `
local organizationCurrent = tonumber(redis.call('GET', KEYS[1]) or '0')
local projectCurrent = tonumber(redis.call('GET', KEYS[2]) or '0')
local weight = tonumber(ARGV[1])
local projectLimit = tonumber(ARGV[2])
local organizationLimit = tonumber(ARGV[3])
local resetTime = tonumber(ARGV[4])
if organizationCurrent + weight > organizationLimit then
  return { organizationCurrent, projectCurrent, 0, 1, resetTime }
end
if projectCurrent + weight > projectLimit then
  return { organizationCurrent, projectCurrent, 1, 0, resetTime }
end
local organizationTotal = redis.call('INCRBY', KEYS[1], weight)
local projectTotal = redis.call('INCRBY', KEYS[2], weight)
redis.call('PEXPIREAT', KEYS[1], resetTime)
redis.call('PEXPIREAT', KEYS[2], resetTime)
return { organizationTotal, projectTotal, 1, 1, resetTime }
`;

const incrementScript = `
local duration = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local currentWindowStart = math.floor(now / duration) * duration
local currentKey = KEYS[1]
local previousKey = KEYS[2]
local currentCount = redis.call('INCR', currentKey)
redis.call('PEXPIREAT', currentKey, currentWindowStart + (2 * duration))
local previousCount = tonumber(redis.call('GET', previousKey) or '0')
local previousWeight = 1 - ((now - currentWindowStart) / duration)
local totalHits = currentCount + (previousCount * previousWeight)
return { currentCount, string.format('%.6f', totalHits), currentWindowStart + duration }
`;

const decrementScript = `
local currentCount = tonumber(redis.call('GET', KEYS[1]) or '0')
if currentCount > 0 then
  redis.call('DECR', KEYS[1])
end
return currentCount
`;

class RedisSlidingWindowCounterStore implements Store {
  localKeys = false;
  prefix: string;

  constructor(
    private readonly client: typeof redisClient,
    private readonly duration: number,
    private readonly namespace: string
  ) {
    this.prefix = namespace;
  }

  async increment(key: string) {
    const now = Date.now();
    const currentWindowStart = Math.floor(now / this.duration) * this.duration;
    const keyPrefix = this.keyPrefix(key);
    const result = (await this.client.eval(incrementScript, {
      keys: [
        `${keyPrefix}:${currentWindowStart}`,
        `${keyPrefix}:${currentWindowStart - this.duration}`
      ],
      arguments: [String(this.duration), String(now)]
    })) as [number | string, string, number | string];

    return {
      totalHits: Number(result[1]),
      resetTime: new Date(Number(result[2]))
    };
  }

  async decrement(key: string) {
    const currentWindowStart = this.getCurrentWindowStart();
    await this.client.eval(decrementScript, {
      keys: [`${this.keyPrefix(key)}:${currentWindowStart}`],
      arguments: []
    });
  }

  async resetKey(key: string) {
    const currentWindowStart = this.getCurrentWindowStart();
    await this.client.unlink([
      `${this.keyPrefix(key)}:${currentWindowStart}`,
      `${this.keyPrefix(key)}:${currentWindowStart - this.duration}`
    ]);
  }

  async resetAll() {
    const keys: string[] = [];
    for await (const scannedKeys of this.client.scanIterator({
      MATCH: `${this.namespace}:*`,
      COUNT: 500
    })) {
      keys.push(...scannedKeys);
      if (keys.length === 500) await this.client.unlink(keys.splice(0));
    }
    if (keys.length > 0) await this.client.unlink(keys);
  }

  private keyPrefix(key: string) {
    return `${this.namespace}:{${key}}`;
  }

  private getCurrentWindowStart() {
    const now = Date.now();
    return Math.floor(now / this.duration) * this.duration;
  }
}

type LimitValue = number | ((req: Request) => number);

const resolveLimit = (limit: LimitValue, req: Request) =>
  typeof limit === 'number' ? limit : limit(req);

export const createEvaluationLimit = (
  limit: LimitValue,
  namespace: string,
  client: typeof redisClient = redisClient
) =>
  rateLimit({
    windowMs,
    limit: (req: Request) => resolveLimit(limit, req),
    keyGenerator: projectKey,
    store: new RedisSlidingWindowCounterStore(client, windowMs, namespace),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many evaluation requests. Please retry later.' }
  });

export const evaluationLimit = createEvaluationLimit(
  req => getProjectPlanEntitlements(req.project?.plan).evaluationsPerMinute,
  'flagforge:rate-limit:evaluate'
);
export const batchEvaluationLimit = createEvaluationLimit(
  req => getProjectPlanEntitlements(req.project?.plan).batchRequestsPerMinute,
  'flagforge:rate-limit:batch'
);

export const createMonthlyEvaluationLimit = (
  limit: LimitValue,
  namespace: string,
  client: typeof redisClient = redisClient,
  organizationLimit: LimitValue = limit
): RequestHandler =>
  async (req, res, next) => {
    const now = new Date(Date.now());
    const resetTime = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    const body = req.body as { flagKeys?: unknown } | undefined;
    const weight = Array.isArray(body?.flagKeys) ? body.flagKeys.length : 1;
    const projectQuotaLimit = resolveLimit(limit, req);
    const organizationQuotaLimit = resolveLimit(organizationLimit, req);
    const organizationId = req.project?.organizationId ?? projectKey(req);
    const month = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
    const hashTag = `{${organizationId}}`;
    const result = (await client.eval(monthlyQuotaScript, {
      keys: [
        `${namespace}:${hashTag}:organization:${month}`,
        `${namespace}:${hashTag}:project:${projectKey(req)}:${month}`
      ],
      arguments: [
        String(weight),
        String(projectQuotaLimit),
        String(organizationQuotaLimit),
        String(resetTime)
      ]
    })) as [number | string, number | string, number | string, number | string, number | string];

    const organizationUsed = Number(result[0]);
    const projectUsed = Number(result[1]);
    const organizationAllowed = Number(result[2]) === 1;
    const projectAllowed = Number(result[3]) === 1;
    res.setHeader('X-Evaluation-Quota-Limit', String(projectQuotaLimit));
    res.setHeader(
      'X-Evaluation-Quota-Remaining',
      String(Math.max(0, projectQuotaLimit - projectUsed))
    );
    res.setHeader('X-Organization-Evaluation-Quota-Limit', String(organizationQuotaLimit));
    res.setHeader(
      'X-Organization-Evaluation-Quota-Remaining',
      String(Math.max(0, organizationQuotaLimit - organizationUsed))
    );
    res.setHeader('X-Evaluation-Quota-Reset', new Date(Number(result[4])).toISOString());

    if (!organizationAllowed) {
      res.status(429).json({ error: 'Organization monthly evaluation quota exceeded.' });
      return;
    }
    if (!projectAllowed) {
      res.status(429).json({ error: 'Project monthly evaluation quota exceeded.' });
      return;
    }

    next();
  };

export const monthlyEvaluationLimit = createMonthlyEvaluationLimit(
  req => getProjectPlanEntitlements(req.project?.plan).monthlyProjectEvaluations,
  'flagforge:quota:evaluate',
  redisClient,
  req => getProjectPlanEntitlements(req.project?.plan).monthlyOrganizationEvaluations
);
