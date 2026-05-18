import express from 'express';
import { checkRateLimit, isRedisConnected } from './redisClient.js';

const app = express();
app.use(express.json());

const RATE_LIMIT = 5; // Max 5 requests
const WINDOW_SECONDS = 60; // per 60 seconds (1 minute)

const rateLimiter = async (req, res, next) => {
  const userIp = req.ip || req.connection.remoteAddress;

  const result = await checkRateLimit(userIp, RATE_LIMIT, WINDOW_SECONDS);

  if (!result.allowed) {
    console.log(`❌ Rate limit exceeded for IP: ${userIp}`);
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      limit: RATE_LIMIT,
      windowSeconds: WINDOW_SECONDS
    });
  }

  if (isRedisConnected()) {
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - result.current));
  }

  next();
};

app.use(rateLimiter);

app.get('/', (req, res) => {
  console.log(`✅ Request allowed for IP: ${req.ip || req.connection.remoteAddress}`);
  res.json({ message: 'Welcome to the Rate Limited API!' });
});

app.get('/data', (req, res) => {
  res.json({ 
    data: ['item1', 'item2', 'item3'], 
    message: 'Here is some sensitive data' 
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Rate Limiting is configured for ${RATE_LIMIT} requests per ${WINDOW_SECONDS} seconds.`);
  console.log('Try sending multiple requests quickly to see rate limiting in action!');
});
