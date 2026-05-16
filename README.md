# Redis Learning Projects

This repository is my Redis learning workspace. It contains small Node.js projects that demonstrate Redis caching, API design, and backend patterns.

---

## 📁 What I have built so far

### 1. `basicUnderstanding/`
A simple Express + MongoDB project to understand basic Redis caching.

- Uses `redis` with Express and Mongoose
- Caches `GET /user-data` responses in Redis
- Uses a request-based cache key for query params
- Stores cached JSON with a TTL
- Invalidates cached results after `PUT /user/:id`
- Includes a benchmark script (`benchmark.js`) for load testing

### 2. `API_Caching/`
A focused Redis API caching demo with a clean separation between cache logic and API logic.

- `app.js` contains API routes
- `redisClient.js` contains Redis connection and helper functions
- `GET /items` and `GET /items/:id` use Redis cache-aside behavior
- `POST /items` and `PUT /items/:id` invalidate cache keys
- Supports running without Redis available
- Includes a README with setup instructions

### 3. `Rate_Limiter/`
Planned folder for Redis-based rate limiting.

- Currently empty in this workspace
- Intended for learning API throttling and request limiting
- Will likely include Redis counters, TTL-based limits, and per-IP/user rules

### 4. `Session_Store/`
Planned folder for Redis session management.

- Currently empty in this workspace
- Intended for learning session persistence and login state storage
- Will likely include Redis session storage and invalidation patterns

---

## 🧠 What I am learning

- Redis cache hit and cache miss behavior
- Cache key design and TTL expiration
- Cache invalidation after writes
- Separation of cache logic from API logic
- How to keep an app working even when Redis is unavailable
