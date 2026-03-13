const { RateLimiterRedis } = require('rate-limiter-flexible');
const { getRedis } = require('../config/redis');

const limiters = new Map();

function rateLimiter({ points = 100, duration = 60 } = {}) {
  const key = `${points}:${duration}`;
  
  return async (req, res, next) => {
    if (!limiters.has(key)) {
      try {
        const redisClient = getRedis();
        limiters.set(key, new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: `rl:${key}`,
          points,
          duration,
        }));
      } catch (err) {
        // Fallback or error if Redis is truly unavailable
        return next();
      }
    }
    
    const limiter = limiters.get(key);
    try {
      const identifier = req.user?.id || req.ip;
      await limiter.consume(identifier);
      next();
    } catch (rejRes) {
      if (rejRes instanceof Error) {
        // Redis connection error or other internal error
        return next(rejRes);
      }
      res.status(429).json({ 
        message: 'Too many requests. Please slow down.',
        retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1
      });
    }
  };
}

module.exports = { rateLimiter };
