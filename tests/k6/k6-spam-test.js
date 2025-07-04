/**
 * K6 Spam Test - Dev War Reservation System
 *
 * PURPOSE: Verify our rate limiter (Problem #2 solution) works correctly
 * VALIDATES: System properly blocks excessive requests and prevents server overload
 * PROBLEM TESTED: Directly tests our solution to Problem #2 (Server Overload)
 *
 * TEST SCENARIO:
 * - 5 aggressive users
 * - Each user hits /api/queue/status as fast as possible
 * - Test runs for 10 seconds
 * - Should trigger rate limiting within seconds
 *
 * EXPECTED RESULTS:
 * - High rate of 429 responses (rate limited)
 * - System remains responsive despite abuse
 * - Redis/API protected from overload
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics to track rate limiting effectiveness
export const rateLimitRate = new Rate("rate_limit_responses");
export const successfulRequests = new Rate("successful_responses");
export const spamResponseTime = new Trend("spam_response_time");
export const totalRequests = new Counter("total_requests_made");
export const blockedRequests = new Counter("blocked_requests");

// Aggressive test configuration
export const options = {
  vus: 5, // 5 virtual users
  duration: "10s", // 10 seconds of aggressive testing

  thresholds: {
    // Rate limiter should activate quickly
    rate_limit_responses: ["rate>0.7"], // Expect >70% requests to be rate limited

    // System should still respond quickly even when blocking
    http_req_duration: ["p(95)<1000"], // 95% of responses under 1s

    // Some requests should succeed (system not completely blocked)
    successful_responses: ["rate>0.1"], // At least 10% should succeed
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function spamTest() {
  const spammerId = `spammer-${__VU}-${__ITER}`;

  // Headers to simulate aggressive client
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": `k6-spam-test-${spammerId}`,
    Accept: "application/json",
  };

  // Rapid-fire requests (no sleep between requests)
  for (let i = 0; i < 10; i++) {
    totalRequests.add(1);

    // Alternate between GET and POST to test both endpoints
    let response;
    if (i % 2 === 0) {
      response = http.get(`${BASE_URL}/api/queue/status`, {
        headers: headers,
        tags: { endpoint: "queue_status_get", test_type: "spam" },
      });
    } else {
      response = http.post(`${BASE_URL}/api/queue/status`, "{}", {
        headers: headers,
        tags: { endpoint: "queue_status_post", test_type: "spam" },
      });
    }

    // Record response time
    spamResponseTime.add(response.timings.duration);

    // Analyze response
    const isRateLimited = response.status === 429;
    const isSuccessful = response.status === 200;

    // Record metrics
    if (isRateLimited) {
      rateLimitRate.add(1);
      blockedRequests.add(1);
      console.log(
        `${spammerId}: Request ${
          i + 1
        } BLOCKED (429) - Rate limiter working! ✅`
      );
    } else {
      rateLimitRate.add(0);
    }

    if (isSuccessful) {
      successfulRequests.add(1);
      console.log(
        `${spammerId}: Request ${
          i + 1
        } succeeded (200) - System still responsive`
      );
    } else {
      successfulRequests.add(0);
    }

    // Validate response structure
    check(response, {
      "Response is 200 or 429 (no crashes)": (r) =>
        r.status === 200 || r.status === 429,
      "Response has valid JSON": (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
      "Rate limited responses have proper message": (r) => {
        if (r.status === 429) {
          try {
            const body = JSON.parse(r.body);
            return body.message && body.message.includes("rate limit");
          } catch {
            return false;
          }
        }
        return true;
      },
    });

    // Log rate limit details
    if (isRateLimited) {
      try {
        const body = JSON.parse(response.body);
        console.log(`${spammerId}: Rate limit message: "${body.message}"`);
      } catch {
        console.log(`${spammerId}: Rate limited but couldn't parse message`);
      }
    }

    // Small delay to prevent completely overwhelming the test runner
    sleep(0.01); // 10ms delay
  }
}

// Setup function
export function setup() {
  console.log("🔥 Starting SPAM TEST for Dev War Reservation System");
  console.log("⚠️  This test is DESIGNED to trigger rate limiting!");
  console.log(`📍 Target URL: ${BASE_URL}`);
  console.log("📊 Test Parameters:");
  console.log("   - Aggressive Users: 5");
  console.log("   - Request Pattern: As fast as possible");
  console.log("   - Duration: 10 seconds");
  console.log("   - Expected Result: HIGH rate of 429 responses");
  console.log("");
  console.log("🎯 This test validates our solution to Problem #2:");
  console.log("   - Rate limiter should activate within seconds");
  console.log("   - System should remain responsive despite abuse");
  console.log("   - Redis/API should be protected from overload");

  // Quick health check
  const healthCheck = http.get(`${BASE_URL}/api/queue/status`);
  if (healthCheck.status !== 200 && healthCheck.status !== 429) {
    throw new Error(`Health check failed. Status: ${healthCheck.status}`);
  }

  console.log("✅ Health check passed. Starting spam test...");
  console.log("⏰ Beginning aggressive request pattern in 3 seconds...");
}

// Teardown function to analyze results
export function teardown() {
  console.log("\n🔥 SPAM TEST Results Summary:");
  console.log("=".repeat(60));

  console.log("\n🎯 Problem #2 (Server Overload) Validation:");
  console.log("📋 Expected Behavior:");
  console.log("   ✓ High rate of 429 (Rate Limited) responses");
  console.log("   ✓ System remains responsive during attack");
  console.log("   ✓ Some requests still succeed (not completely blocked)");
  console.log("   ✓ Fast response times even when blocking");

  console.log("\n📊 If you see 70%+ rate limiting:");
  console.log("   🎉 SUCCESS! Rate limiter is protecting the system");
  console.log("   🛡️  Problem #2 (Server Overload) is SOLVED");

  console.log("\n📊 If you see mostly 200 responses:");
  console.log("   ⚠️  Rate limiter may need tuning");
  console.log("   🔧 Check rate limit configuration in route.ts");

  console.log("\n🚀 This test proves our system can handle:");
  console.log("   ✓ Malicious traffic patterns");
  console.log("   ✓ Accidental request storms");
  console.log("   ✓ High-traffic scenarios");
  console.log("   ✓ Resource protection under load");
}
