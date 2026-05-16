import express from 'express';
import {
  getCache,
  setCache,
  deleteCache,
  isRedisConnected,
} from './redisClient.js';

const app = express();
app.use(express.json());

const items = [
  { id: '1', name: 'Apple', category: 'fruit' },
  { id: '2', name: 'Bread', category: 'bakery' },
  { id: '3', name: 'Milk', category: 'dairy' },
];

const CACHE_TTL_SECONDS = 60; // 1 minute

app.get('/items', async (req, res) => {
  const cacheKey = 'items:all';

  try {
    if (isRedisConnected()) {
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log('✅ Cache HIT for', cacheKey);
        return res.json({ source: 'cache', data: JSON.parse(cached) });
      }

      console.log('❌ Cache MISS for', cacheKey);
      await setCache(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(items));
      return res.json({ source: 'db', data: items });
    }

    console.warn('⚠️  Redis unavailable, returning data without cache');
    return res.json({ source: 'db', data: items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/items/:id', async (req, res) => {
  const id = req.params.id;
  const cacheKey = `item:${id}`;

  try {
    if (isRedisConnected()) {
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log('✅ Cache HIT for', cacheKey);
        return res.json({ source: 'cache', data: JSON.parse(cached) });
      }
    }

    const item = items.find((item) => item.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (isRedisConnected()) {
      console.log('❌ Cache MISS for', cacheKey);
      await setCache(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(item));
    } else {
      console.warn('⚠️  Redis unavailable, returning item without cache');
    }

    return res.json({ source: 'db', data: item });
  } catch (error) {
    console.error('Error fetching item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/items', async (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'name and category are required' });
  }

  const newItem = {
    id: String(items.length + 1),
    name,
    category,
  };
  items.push(newItem);

  if (isRedisConnected()) {
    await deleteCache('items:all');
    console.log('🗑️  Invalidated cache for items:all');
  } else {
    console.warn('⚠️  Redis unavailable, skipped cache invalidation');
  }

  return res.status(201).json({ success: true, data: newItem });
});

app.put('/items/:id', async (req, res) => {
  const id = req.params.id;
  const item = items.find((item) => item.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const { name, category } = req.body;
  if (name) item.name = name;
  if (category) item.category = category;

  if (isRedisConnected()) {
    await Promise.all([
      deleteCache('items:all'),
      deleteCache(`item:${id}`),
    ]);
    console.log('🗑️  Invalidated cache for items:all and item:' + id);
  } else {
    console.warn('⚠️  Redis unavailable, skipped cache invalidation');
  }

  return res.json({ success: true, data: item });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Try GET /items and GET /items/1');
});
