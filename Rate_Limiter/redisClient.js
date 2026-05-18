import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: () => false,
  },
});

let connected = false;
let connecting = false;

redisClient.on('error', (err) => {
  if (!connected) return;
  console.error('Redis Client Error', err);
});

async function connectRedis() {
  if (connected || connecting) return;
  connecting = true;

  try {
    await redisClient.connect();
    connected = true;
    console.log(`✅ Redis connected at ${redisUrl}`);
  } catch (err) {
    connected = false;
    console.warn(`⚠️  Redis connection failed at ${redisUrl}. Running without rate limiter.`);
  } finally {
    connecting = false;
  }
}

// Periodically try to reconnect if disconnected
setInterval(connectRedis, 10000);

await connectRedis();

export function isRedisConnected() {
  return connected;
}

/**
 * Checks the rate limit for a given identifier (e.g. IP address).
 * @param {string} identifier - The unique identifier to rate limit.
 * @param {number} limit - The maximum number of requests allowed.
 * @param {number} windowSeconds - The time window in seconds.
 * @returns {Promise<{allowed: boolean, current: number}>}
 */
export async function checkRateLimit(identifier, limit, windowSeconds) {
  // If Redis is not connected, fail open (allow request) so the app doesn't crash completely
  if (!connected) return { allowed: true, current: 0 }; 

  const key = `rate-limit:${identifier}`;
  
  try {
    // Increment the count for this identifier
    const current = await redisClient.incr(key);
    
    // If it's the first request in the window, set the expiration time
    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }
    
    // Check if the current count exceeds the limit
    if (current > limit) {
      return { allowed: false, current };
    }
    
    return { allowed: true, current };
  } catch (err) {
    console.warn('⚠️  Redis rate limiting failed, allowing request:', err.message);
    return { allowed: true, current: 0 };
  }
}
