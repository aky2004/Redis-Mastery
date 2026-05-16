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
    console.warn(`⚠️  Redis connection failed at ${redisUrl}. Running without cache.`);
  } finally {
    connecting = false;
  }
}

setInterval(connectRedis, 10000);

await connectRedis();

export function isRedisConnected() {
  return connected;
}

export async function getCache(key) {
  if (!connected) return null;

  try {
    return await redisClient.get(key);
  } catch (err) {
    console.warn('⚠️  Redis get failed, skipping cache:', err.message);
    return null;
  }
}

export async function setCache(key, ttl, value) {
  if (!connected) return;

  try {
    await redisClient.setEx(key, ttl, value);
  } catch (err) {
    console.warn('⚠️  Redis set failed, skipping cache:', err.message);
  }
}

export async function deleteCache(key) {
  if (!connected) return;

  try {
    await redisClient.del(key);
  } catch (err) {
    console.warn('⚠️  Redis delete failed, skipped invalidation:', err.message);
  }
}
