import redis from '../config/redis.js';

const SECONDS = process.env.RATE_LIMIT_SECONDS
const WINDOW_SIZE = SECONDS * 1000; // 30 sec
const MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS

const rateLimiter = async (req, res, next) => {
  try {
    if(!SECONDS) throw new Error('RATE_LIMIT_SECONDS env variable is required')
    if(!MAX_REQUESTS) throw new Error('RATE_LIMIT_MAX_REQUESTS env variable is required')
        
    const tenantId = req.query.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({
        message: 'tenant is required'
      });
    }

    const key = `rate:${tenantId}`;
    const now = Date.now();

    // 1. Add current request timestamp
    await redis.zAdd(key, [{ score: now, value: `${now}` }]);

    // 2. Remove old requests
    await redis.zRemRangeByScore(key, 0, now - WINDOW_SIZE);

    // 3. Count current requests
    const count = await redis.zCard(key);

    // 4. Set expiry (cleanup)
    await redis.expire(key, SECONDS);

    if (count > MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests'
      });
    }

    next();

  } catch (err) {
    console.error('Rate limiter error:', err);
    next(); // fail open (important)
  }
};

export default rateLimiter;