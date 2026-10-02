import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'
});

redisClient.on('error', error => {
  console.error('Redis client error', error);
});

export async function connectRedis() {
  if (!redisClient.isOpen) await redisClient.connect();
}

export async function disconnectRedis() {
  if (redisClient.isOpen) await redisClient.quit();
}

export default redisClient;