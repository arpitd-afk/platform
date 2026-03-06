const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient;

async function connectRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
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

function getRedis() {
  if (!redisClient) throw new Error('Redis not initialized');
  return redisClient;
}

// Cache helpers
const cache = {
  async get(key) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      logger.error('Cache set error:', err);
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
    } catch (err) {
      logger.error('Cache del error:', err);
    }
  },

  async invalidatePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) await redisClient.del(keys);
    } catch (err) {
      logger.error('Cache invalidate error:', err);
    }
  },
};

// Session/real-time helpers
const session = {
  async setGameState(gameId, state) {
    await redisClient.setEx(`game:${gameId}`, 3600, JSON.stringify(state));
  },

  async getGameState(gameId) {
    const val = await redisClient.get(`game:${gameId}`);
    return val ? JSON.parse(val) : null;
  },

  async setClassroomBoard(classroomId, fen) {
    await redisClient.setEx(`classroom:${classroomId}:fen`, 86400, fen);
  },

  async getClassroomBoard(classroomId) {
    return redisClient.get(`classroom:${classroomId}:fen`);
  },

  async setUserOnline(userId, socketId) {
    await redisClient.hSet('online_users', userId, socketId);
    await redisClient.expire('online_users', 86400);
  },

  async setUserOffline(userId) {
    await redisClient.hDel('online_users', userId);
  },

  async isUserOnline(userId) {
    return !!(await redisClient.hGet('online_users', userId));
  },

  async getOnlineUsers() {
    return redisClient.hGetAll('online_users');
  },
};

module.exports = { connectRedis, getRedis, cache, session };
