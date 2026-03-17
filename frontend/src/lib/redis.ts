import { createClient, RedisClientType } from 'redis';
import logger from './logger';
import config from './config';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<RedisClientType> {
  redisClient = createClient({
    url: config.redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error('Redis: too many retries');
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redisClient.on('error', (err) => logger.error('Redis error:', err));
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  await redisClient.connect();
  return redisClient;
}

export function getRedis(): RedisClientType {
  if (!redisClient) throw new Error('Redis not initialized');
  return redisClient;
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisClient) return null;
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      logger.error('Cache set error:', err);
    }
  },

  async del(key: string): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.del(key);
    } catch (err) {
      logger.error('Cache del error:', err);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    if (!redisClient) return;
    try {
      let cursor = 0;
      do {
        const reply = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        cursor = reply.cursor;
        const keys = reply.keys;
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } while (cursor !== 0);
    } catch (err) {
      logger.error('Cache invalidate error:', err);
    }
  },
};

export const redisSession = {
  async setGameState(gameId: string, state: any): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.setEx(`game:${gameId}`, 3600, JSON.stringify(state));
    } catch (err) {
      logger.error('Redis setGameState error:', err);
    }
  },

  async getGameState(gameId: string): Promise<any | null> {
    if (!redisClient) return null;
    try {
      const val = await redisClient.get(`game:${gameId}`);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async setClassroomBoard(classroomId: string, fen: string): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.setEx(`classroom:${classroomId}:fen`, 86400, fen);
    } catch (err) {
      logger.error('Redis setClassroomBoard error:', err);
    }
  },

  async getClassroomBoard(classroomId: string): Promise<string | null> {
    if (!redisClient) return null;
    try {
      return await redisClient.get(`classroom:${classroomId}:fen`);
    } catch {
      return null;
    }
  },

  async setUserOnline(userId: string, socketId: string): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.hSet('online_users', userId, socketId);
      await redisClient.expire('online_users', 86400);
    } catch (err) {
      logger.error('Redis setUserOnline error:', err);
    }
  },

  async setUserOffline(userId: string): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.hDel('online_users', userId);
    } catch (err) {
      logger.error('Redis setUserOffline error:', err);
    }
  },

  async isUserOnline(userId: string): Promise<boolean> {
    if (!redisClient) return false;
    try {
      return !!(await redisClient.hGet('online_users', userId));
    } catch {
      return false;
    }
  },

  async getOnlineUsers(): Promise<Record<string, string>> {
    if (!redisClient) return {};
    try {
      return await redisClient.hGetAll('online_users');
    } catch {
      return {};
    }
  },
};
