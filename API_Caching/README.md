# Redis API Caching Demo

A small Express API demonstrating how Redis can be used to cache HTTP responses while keeping write operations consistent through cache invalidation.

This project is designed as a learning example for developers who want to understand:

- cache hit / cache miss flow
- storing JSON payloads in Redis with TTL
- invalidating cached resources after create/update operations
- fallback behavior when Redis is unavailable

---

## Features

- `GET /items`
  - Reads all items from the in-memory dataset
  - Returns cached results when available
  - Stores response in Redis with a TTL
- `GET /items/:id`
  - Reads a single item by ID
  - Uses Redis caching per item key
- `POST /items`
  - Adds a new item to the in-memory list
  - Invalidates the collection cache (`items:all`)
- `PUT /items/:id`
  - Updates an existing item
  - Invalidates both the collection and item cache keys

---

## Architecture

- `app.js` contains the Express routes and cache-aware request handlers
- `redisClient.js` handles Redis connection, cache reads/writes, and invalidation
- The app uses an in-memory dataset for demo purposes, so Redis is used only for caching
- Redis connectivity is optional: the server still responds if Redis is unavailable

---

## Setup

```bash
cd /Users/aky113114/Downloads/redisTry/API_Caching
npm install
```

### Start Redis

On macOS with Homebrew:

```bash
brew install redis
brew services start redis
```

If Redis is already installed, start it manually:

```bash
redis-server /usr/local/etc/redis.conf
```

The app also supports a custom Redis URL via `REDIS_URL`.

---

## Run the app

```bash
npm start
```

The server starts on `http://localhost:3001` by default.

---

## API Reference

### `GET /items`

Returns the full item list.

Response shape:

```json
{
  "source": "cache|db",
  "data": [
    { "id": "1", "name": "Apple", "category": "fruit" },
    { "id": "2", "name": "Bread", "category": "bakery" },
    { "id": "3", "name": "Milk", "category": "dairy" }
  ]
}
```

### `GET /items/:id`

Returns a single item by ID.

### `POST /items`

Creates a new item.

Request body:

```json
{ "name": "Banana", "category": "fruit" }
```

Response:

```json
{ "success": true, "data": { "id": "4", "name": "Banana", "category": "fruit" } }
```

### `PUT /items/:id`

Updates an existing item.

Request body may include one or both fields:

```json
{ "name": "Yeast Bread", "category": "bakery" }
```

---

## Cache behavior

- Cached entries use a TTL of 60 seconds
- `items:all` stores the full list response
- `item:<id>` stores individual item responses
- Writes invalidate relevant cache keys so stale data is not returned
- If Redis is down, the app continues to operate without caching

---

## Notes for developers

- This project is intentionally simple and uses an in-memory dataset instead of a real database
- In production, move the item store to a persistent database and keep Redis as a dedicated cache layer
- Consider adding tests for caching behavior and Redis failure handling
