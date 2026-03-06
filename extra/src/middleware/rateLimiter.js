const { RateLimiterMemory } = require('rate-limiter-flexible');

const limiters = new Map();

function rateLimiter({ points = 100, duration = 60 } = {}) {
  const key = `${points}:${duration}`;
  if (!limiters.has(key)) {
    limiters.set(key, new RateLimiterMemory({ points, duration }));
  }
  const limiter = limiters.get(key);

  return async (req, res, next) => {
    try {
      const identifier = req.user?.id || req.ip;
      await limiter.consume(identifier);
      next();
    } catch {
      res.status(429).json({ message: 'Too many requests. Please slow down.' });
    }
  };
}

module.exports = { rateLimiter };
