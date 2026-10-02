import rateLimit, { type Store } from 'express-rate-limit';
import type { Request, RequestHandler } from 'express';
import redisClient from '../db/redis';

const projectKey = (req: Request) => req.project!.id;
const windowMs = 60 * 1000;
const monthlyQuotaScript = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local weight = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local resetTime = tonumber(ARGV[3])
if current + weight > limit then
  return { current, 0, resetTime }
end
local total = redis.call('INCRBY', KEYS[1], weight)
redis.call('PEXPIREAT', KEYS[1], resetTime)
return { total, 1, resetTime }
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

export const createEvaluationLimit = (
  limit: number,
  namespace: string,
  client: typeof redisClient = redisClient
) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator: projectKey,
    store: new RedisSlidingWindowCounterStore(client, windowMs, namespace),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many evaluation requests. Please retry later.' }
  });

export const evaluationLimit = createEvaluationLimit(60, 'flagforge:rate-limit:evaluate');
export const batchEvaluationLimit = createEvaluationLimit(10, 'flagforge:rate-limit:batch');

export const createMonthlyEvaluationLimit = (
  limit: number,
  namespace: string,
  client: typeof redisClient = redisClient
): RequestHandler =>
  async (req, res, next) => {
    const now = new Date(Date.now());
    const resetTime = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    const body = req.body as { flagKeys?: unknown } | undefined;
    const weight = Array.isArray(body?.flagKeys) ? body.flagKeys.length : 1;
    const result = (await client.eval(monthlyQuotaScript, {
      keys: [`${namespace}:{${projectKey(req)}}:${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`],
      arguments: [String(weight), String(limit), String(resetTime)]
    })) as [number | string, number | string, number | string];

    const used = Number(result[0]);
    const allowed = Number(result[1]) === 1;
    res.setHeader('X-Evaluation-Quota-Limit', String(limit));
    res.setHeader('X-Evaluation-Quota-Remaining', String(Math.max(0, limit - used)));
    res.setHeader('X-Evaluation-Quota-Reset', new Date(Number(result[2])).toISOString());

    if (!allowed) {
      res.status(429).json({ error: 'Monthly evaluation quota exceeded. Please retry after it resets.' });
      return;
    }

    next();
  };

export const monthlyEvaluationLimit = createMonthlyEvaluationLimit(
  100_000,
  'flagforge:quota:evaluate'
);
