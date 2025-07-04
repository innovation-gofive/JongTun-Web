// 🔴 Red Team K6 Load Testing Script
// Advanced load testing and attack simulation for Dev War system

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("error_rate");
const bypassAttempts = new Counter("bypass_attempts");
const spamRequests = new Counter("spam_requests");
const rateLimitHits = new Counter("rate_limit_hits");
const securityBlocks = new Counter("security_blocks");

// ==========================================
// RED TEAM ATTACK SCENARIOS
// ==========================================

export const options = {
  scenarios: {
    // 1. LOAD ATTACK - Massive concurrent users
    load_attack: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 100 }, // Ramp up
        { duration: "1m", target: 500 }, // Stress test
        { duration: "30s", target: 1000 }, // Peak attack
        { duration: "1m", target: 1000 }, // Sustained attack
        { duration: "30s", target: 0 }, // Ramp down
      ],
      tags: { attack_type: "load" },
    },

    // 2. API SPAM - Rapid API flooding
    api_spam: {
      executor: "constant-rate",
      rate: 100, // 100 requests per second
      duration: "2m",
      preAllocatedVUs: 50,
      tags: { attack_type: "spam" },
    },

    // 3. QUEUE BYPASS - Attempt to skip queue
    queue_bypass: {
      executor: "per-vu-iterations",
      vus: 20,
      iterations: 50,
      tags: { attack_type: "bypass" },
    },

    // 4. RATE LIMIT TESTING - Test rate limiting effectiveness
    rate_limit_test: {
      executor: "constant-vus",
      vus: 10,
      duration: "1m",
      tags: { attack_type: "rate_limit" },
    },
  },

  thresholds: {
    // System should maintain stability under attack
    http_req_duration: ["p(95)<5000"], // 95% of requests under 5s
    http_req_failed: ["rate<0.5"], // Less than 50% failure rate
    error_rate: ["rate<0.8"], // Less than 80% errors (some expected)
    rate_limit_hits: ["count>0"], // Rate limiting should trigger
    security_blocks: ["count>0"], // Security should block some attempts
  },
};

// Base URL for the application
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Red Team user agent
const RED_TEAM_HEADERS = {
  "User-Agent": "RedTeam-K6-Attacker/1.0",
  "X-Attack-Simulation": "true",
  "X-Red-Team": "dev-war-2025",
};

// ==========================================
// ATTACK FUNCTIONS
// ==========================================

// 1. Load Attack Function
export function loadAttack() {
  const attackId = `load_${__VU}_${__ITER}`;

  // Simulate normal user behavior but at scale
  const responses = [
    // Join queue
    http.post(
      `${BASE_URL}/api/queue/join`,
      JSON.stringify({
        userId: attackId,
        productId: "special-product",
        quantity: Math.floor(Math.random() * 5) + 1,
        timestamp: Date.now(),
      }),
      {
        headers: {
          ...RED_TEAM_HEADERS,
          "Content-Type": "application/json",
        },
        tags: { endpoint: "queue_join" },
      }
    ),

    // Check queue status rapidly
    http.get(`${BASE_URL}/api/queue/status`, {
      headers: RED_TEAM_HEADERS,
      tags: { endpoint: "queue_status" },
    }),

    // Get branches
    http.get(`${BASE_URL}/api/queue/monitor`, {
      headers: RED_TEAM_HEADERS,
      tags: { endpoint: "queue_monitor" },
    }),
  ];

  responses.forEach((response, index) => {
    const passed = check(response, {
      [`Load Attack ${index} - Status 200-500`]: (r) =>
        r.status >= 200 && r.status <= 500,
      [`Load Attack ${index} - Response time OK`]: (r) =>
        r.timings.duration < 10000,
    });

    if (!passed) {
      errorRate.add(1);
    }

    // Check if rate limited
    if (response.status === 429) {
      rateLimitHits.add(1);
    }

    // Check for security blocks
    if (response.status === 403 || response.status === 401) {
      securityBlocks.add(1);
    }
  });

  sleep(0.1); // Minimal sleep for maximum pressure
}

// 2. API Spam Attack Function
export function apiSpam() {
  const spamTargets = [
    "/api/queue/status",
    "/api/queue/monitor",
    "/api/branches",
    "/select-branch",
    "/select-product",
  ];

  spamTargets.forEach((endpoint) => {
    // Rapid fire requests
    for (let i = 0; i < 10; i++) {
      const response = http.get(`${BASE_URL}${endpoint}`, {
        headers: {
          ...RED_TEAM_HEADERS,
          "X-Spam-Round": i.toString(),
          "X-Spam-Endpoint": endpoint,
        },
        tags: {
          endpoint: endpoint.replace("/", "_"),
          attack_type: "spam",
        },
      });

      spamRequests.add(1);

      check(response, {
        "Spam request processed": (r) => r.status !== 0,
        "Rate limit active": (r) => r.status === 429,
      });

      if (response.status === 429) {
        rateLimitHits.add(1);
      }
    }
  });
}

// 3. Queue Bypass Attack Function
export function queueBypass() {
  const bypassId = `bypass_${__VU}_${__ITER}_${Date.now()}`;

  // Attempt 1: Direct access to protected pages
  const directAccess = http.get(`${BASE_URL}/confirmation`, {
    headers: {
      ...RED_TEAM_HEADERS,
      "X-Bypass-Attempt": "direct-access",
    },
    tags: { bypass_type: "direct_access" },
  });

  bypassAttempts.add(1);

  // Attempt 2: Fake reservation ID
  const fakeReservation = http.post(
    `${BASE_URL}/api/queue/join`,
    JSON.stringify({
      userId: bypassId,
      reservationId: "FAKE_" + Date.now(),
      forceConfirm: true,
      bypassQueue: true,
    }),
    {
      headers: {
        ...RED_TEAM_HEADERS,
        "Content-Type": "application/json",
        "X-Bypass-Attempt": "fake-reservation",
      },
      tags: { bypass_type: "fake_reservation" },
    }
  );

  bypassAttempts.add(1);

  // Attempt 3: Status manipulation
  const statusManip = http.post(
    `${BASE_URL}/api/queue/status`,
    JSON.stringify({
      forceStatus: "confirmed",
      adminOverride: true,
      userId: bypassId,
    }),
    {
      headers: {
        ...RED_TEAM_HEADERS,
        "Content-Type": "application/json",
        "X-Bypass-Attempt": "status-manipulation",
      },
      tags: { bypass_type: "status_manipulation" },
    }
  );

  bypassAttempts.add(1);

  // Check if any bypass succeeded (should not!)
  const bypassResults = [directAccess, fakeReservation, statusManip];
  bypassResults.forEach((response, index) => {
    const blocked = check(response, {
      [`Bypass attempt ${index} blocked`]: (r) =>
        r.status === 403 || r.status === 401 || r.status === 400,
      [`Bypass attempt ${index} not successful`]: (r) => r.status !== 200,
    });

    if (!blocked) {
      console.warn(
        `🚨 SECURITY ALERT: Bypass attempt ${index} may have succeeded!`
      );
    }

    if (response.status === 403 || response.status === 401) {
      securityBlocks.add(1);
    }
  });

  sleep(0.5);
}

// 4. Rate Limit Testing Function
export function rateLimitTest() {
  const userId = `ratetest_${__VU}`;

  // Rapid successive requests to trigger rate limiting
  for (let i = 0; i < 15; i++) {
    const response = http.post(
      `${BASE_URL}/api/queue/join`,
      JSON.stringify({
        userId: userId,
        productId: "special-product",
        quantity: 1,
        attempt: i,
      }),
      {
        headers: {
          ...RED_TEAM_HEADERS,
          "Content-Type": "application/json",
          "X-Rate-Test": i.toString(),
        },
        tags: { test_type: "rate_limit" },
      }
    );

    if (response.status === 429) {
      rateLimitHits.add(1);

      // Check rate limit headers
      check(response, {
        "Rate limit headers present": (r) =>
          r.headers["X-RateLimit-Limit"] || r.headers["Retry-After"],
      });
    }

    // No sleep - maximum pressure
  }
}

// ==========================================
// MAIN SCENARIO SELECTOR
// ==========================================

export default function main() {
  switch (__ENV.K6_SCENARIO_NAME) {
    case "load_attack":
      loadAttack();
      break;
    case "api_spam":
      apiSpam();
      break;
    case "queue_bypass":
      queueBypass();
      break;
    case "rate_limit_test":
      rateLimitTest();
      break;
    default:
      // Mixed attack - randomly choose
      const attacks = [loadAttack, apiSpam, queueBypass, rateLimitTest];
      const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
      randomAttack();
  }
}

// ==========================================
// SETUP AND TEARDOWN
// ==========================================

export function setup() {
  console.log("🔴 RED TEAM K6 ATTACK INITIATED");
  console.log("🎯 Target:", BASE_URL);
  console.log(
    "⚠️  This is a security test - system should resist these attacks"
  );

  // Verify target is responsive
  const healthCheck = http.get(`${BASE_URL}/`, {
    headers: RED_TEAM_HEADERS,
  });

  if (healthCheck.status !== 200) {
    throw new Error(`Target not responsive: ${healthCheck.status}`);
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log("🔴 RED TEAM ATTACK COMPLETED");
  console.log(`⏱️  Duration: ${duration}s`);
  console.log("📊 Security systems should have blocked most attempts");
  console.log("🔍 Review logs for detailed security analysis");
}
