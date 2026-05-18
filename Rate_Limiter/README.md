# Redis Rate Limiter Demo

This project is a small demonstration of how to build an API Rate Limiter using Redis and Node.js (Express). It is structurally similar to the API Caching demo, making it easy to understand if you have explored the caching project.

## How It Works

Rate limiting is used to control the rate of traffic sent or received by a network interface controller. It prevents abuse, DoS attacks, and ensures fair usage of API resources.

In this project, we implement the **Fixed Window Counter** algorithm using Redis:
1. Every time a user makes an API request, we identify them (in this case, by their IP address).
2. We increment a counter in Redis for that specific IP (`INCR`).
3. If this is the first request in the time window, we set an expiration time (`EXPIRE`) for the key (e.g., 60 seconds).
4. If the counter exceeds the allowed limit (e.g., 5 requests), we reject the request with a `429 Too Many Requests` HTTP status code.
5. Once the time window expires, the Redis key is automatically deleted, and the user's limit is reset.

## Project Structure

- `app.js` - The main Express application. It sets up the server, defines the routes, and registers the rate limiting middleware.
- `redisClient.js` - Handles the Redis connection and provides the `checkRateLimit` helper function to increment the counter and set expirations.
- `package.json` - Defines the project metadata and dependencies.

## Prerequisites

- Node.js installed
- Redis server running locally (or provide a `REDIS_URL` environment variable)

## Setup and Running

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Server:**
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3002` by default.

## Testing the Rate Limiter

You can test the rate limiter by making rapid requests to the server. You can use your browser, `curl`, or an API tool like Postman.

```bash
# Make a request
curl http://localhost:3002/

# Repeat the request 5+ times quickly
```

After 5 requests within a 60-second window, you should start receiving a `429` status code with the following response:

```json
{
  "error": "Too many requests. Please try again later.",
  "limit": 5,
  "windowSeconds": 60
}
```

## Fail-Open Design

Similar to the API Caching demo, this project implements a "fail-open" design. If the Redis server crashes or becomes unavailable, the application will catch the error and allow the requests to pass through (`return { allowed: true, current: 0 }`). This ensures that your API remains functional even if the rate limiter is temporarily down.
