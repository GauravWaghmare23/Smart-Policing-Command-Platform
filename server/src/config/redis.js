import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;
let isRedisAvailable = false;

export const initRedis = () => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 1000, 5000);
        return delay;
      },
      enableOfflineQueue: true,
      lazyConnect: true
    });

    redisClient.connect().then(() => {
      isRedisAvailable = true;
      console.log('Redis connected successfully at:', env.redisUrl);
    }).catch((err) => {
      isRedisAvailable = false;
      console.warn(`Redis connection warning (${err.message}). In-memory fallbacks will be active.`);
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
    });

    redisClient.on('ready', () => {
      isRedisAvailable = true;
    });
  } catch (err) {
    isRedisAvailable = false;
    console.warn('Redis initialization skipped:', err.message);
  }

  return redisClient;
};

export const getRedisClient = () => redisClient;
export const checkRedisAvailable = () => isRedisAvailable;

// Key prefixes
export const REDIS_KEYS = {
  OFFICER_LOC: (officerId) => `officer:loc:${officerId}`,
  OFFICER_GEO: 'officers:geo',
  ACTIVE_SOS: (sosId) => `sos:active:${sosId}`,
  ACTIVE_PATROL: (patrolId) => `patrol:active:${patrolId}`
};
