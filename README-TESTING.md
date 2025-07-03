# Dev War K6 Testing Suite

This directory contains K6 performance tests that validate our solutions to the three core problems.

## 🎯 Test Scripts

### 1. Load Test (`k6-load-test.js`)

**Purpose**: Validate system performance under expected normal load
**Simulates**: 500 users polling every 5 seconds for 1 minute
**Tests**: Baseline performance and scalability

### 2. Spam Test (`k6-spam-test.js`)

**Purpose**: Verify our rate limiter (Problem #2 solution) works correctly
**Simulates**: 5 aggressive users hitting API as fast as possible for 10 seconds
**Tests**: Rate limiting effectiveness and server protection

## 🚀 Running the Tests

### Prerequisites

1. Install K6: https://k6.io/docs/getting-started/installation/
2. Start your Next.js development server: `npm run dev`
3. Ensure your environment variables are set (especially Redis config)

### Run Individual Tests

```bash
# Load Test (Normal Usage Pattern)
k6 run k6-load-test.js

# Spam Test (Rate Limiter Validation)
k6 run k6-spam-test.js

# Run against different URL
k6 run --env BASE_URL=http://localhost:3000 k6-load-test.js
```

### Run Both Tests Sequentially

```bash
# PowerShell
./run-tests.ps1

# Or manually:
k6 run k6-load-test.js && k6 run k6-spam-test.js
```

## 📊 Expected Results

### Load Test Success Indicators:

- ✅ 95% of requests complete under 2 seconds
- ✅ Error rate under 10%
- ✅ Some rate limiting occurs (proves protection works)
- ✅ System remains stable under 500 concurrent users

### Spam Test Success Indicators:

- ✅ **70%+ requests get 429 (Rate Limited)** - This proves Problem #2 is solved!
- ✅ Fast response times even when blocking requests
- ✅ Some requests still succeed (system not completely blocked)
- ✅ No crashes or timeouts

## 🎯 What These Tests Prove

### Problem #1 (Unreliable UI):

- Load test verifies the queue API returns consistent, truthful data under load
- Real queue positions and totals are maintained even with 500 concurrent users

### Problem #2 (Server Overload):

- **Spam test directly validates our rate limiter**
- High 429 response rates prove the system blocks excessive requests
- Redis and API remain protected from abuse

### Problem #3 (Lack of Resilience):

- Both tests verify error handling and graceful degradation
- System continues operating even when rate limits are triggered

## 🔧 Troubleshooting

### If Load Test Fails:

- Check if Next.js server is running (`npm run dev`)
- Verify Redis connection (check .env.local)
- Reduce concurrent users if system is underpowered

### If Spam Test Shows Low Rate Limiting:

- Check rate limiter configuration in `src/app/api/queue/status/route.ts`
- Verify Upstash Redis connection
- Consider the rate limit may be per-IP (multiple K6 users = same IP)

### Common Issues:

- **Connection refused**: Start the Next.js server
- **Low rate limiting**: Expected if testing locally (same IP)
- **High error rates**: Check Redis configuration and server resources

## 📈 Interpreting Results

The key metric for our mission is the **rate limiting effectiveness** in the spam test. A high rate of 429 responses (70%+) proves that our solution to Problem #2 (Server Overload) is working correctly.

These tests demonstrate that our Dev War reservation system can handle real-world traffic patterns while protecting itself from abuse - exactly what we set out to build! 🎉
