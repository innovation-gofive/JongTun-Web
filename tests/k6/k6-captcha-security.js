// 🔴 K6 CAPTCHA Security Load Testing
// Advanced CAPTCHA bypass and stress testing with K6

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Counter, Trend } from "k6/metrics";

// Custom metrics for CAPTCHA testing
const captchaBypassRate = new Rate("captcha_bypass_rate");
const captchaValidationErrors = new Counter("captcha_validation_errors");
const captchaResponseTime = new Trend("captcha_response_time");
const invalidTokenAttempts = new Counter("invalid_token_attempts");
const noTokenAttempts = new Counter("no_token_attempts");

// ==========================================
// CAPTCHA SECURITY TEST SCENARIOS
// ==========================================

export const options = {
  scenarios: {
    // 1. CAPTCHA Bypass Attack - Test security vulnerabilities
    captcha_bypass_attack: {
      executor: "constant-vus",
      vus: 20,
      duration: "2m",
      tags: { test_type: "captcha_bypass" },
    },

    // 2. CAPTCHA Stress Test - High load with valid tokens
    captcha_stress_test: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 100 },
        { duration: "30s", target: 0 },
      ],
      tags: { test_type: "captcha_stress" },
    },

    // 3. CAPTCHA Validation Test - Various token formats
    captcha_validation_test: {
      executor: "constant-vus",
      vus: 10,
      duration: "1m",
      tags: { test_type: "captcha_validation" },
    },
  },

  thresholds: {
    // CAPTCHA security thresholds
    captcha_bypass_rate: ["rate<0.1"], // Less than 10% bypass rate
    captcha_validation_errors: ["count>0"], // Should generate validation errors
    captcha_response_time: ["p(95)<2000"], // CAPTCHA validation under 2s
    http_req_failed: ["rate<0.5"], // Less than 50% failure rate
  },
};

// Base configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const CAPTCHA_ENABLED = __ENV.CAPTCHA_ENABLED || "true";

// Test headers
const ATTACK_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "K6-CaptchaAttacker/1.0",
  "X-Test-Type": "captcha-security",
};

// ==========================================
// CAPTCHA TOKEN GENERATORS
// ==========================================

function generateFakeTokens() {
  return [
    "fake_token_12345",
    "invalid_captcha_response",
    "bypassed_token_attempt",
    "null",
    "",
    "undefined",
    "03AGdBq25SiQUQih2KO3PHON_Xl5N5LqV5VzQP8", // Malformed
    "expired_token_" + Date.now(),
    "replay_token_static",
    "injection_attempt_<script>alert('xss')</script>",
    "../../../etc/passwd", // Path traversal attempt
    "' OR 1=1 --", // SQL injection attempt
  ];
}

function generateTestPayload(userId, tokenType = "none") {
  const basePayload = {
    userId: userId,
    productId: "special-product",
    quantity: Math.floor(Math.random() * 3) + 1,
  };

  const headers = { ...ATTACK_HEADERS };

  switch (tokenType) {
    case "fake":
      headers["X-Captcha-Token"] =
        generateFakeTokens()[
          Math.floor(Math.random() * generateFakeTokens().length)
        ];
      break;
    case "valid":
      headers["X-Captcha-Token"] = "valid_test_token_" + Date.now();
      break;
    case "empty":
      headers["X-Captcha-Token"] = "";
      break;
    case "malformed":
      headers["X-Captcha-Token"] = "malformed" + Math.random();
      break;
    case "none":
    default:
      // No token header
      break;
  }

  return { payload: basePayload, headers };
}

// ==========================================
// TEST SCENARIOS
// ==========================================

// eslint-disable-next-line import/no-anonymous-default-export
export default function () {
  const scenario = __ENV.K6_SCENARIO || "captcha_bypass_attack";

  switch (scenario) {
    case "captcha_bypass_attack":
      testCaptchaBypass();
      break;
    case "captcha_stress_test":
      testCaptchaStress();
      break;
    case "captcha_validation_test":
      testCaptchaValidation();
      break;
    default:
      testCaptchaBypass();
  }
}

// ==========================================
// CAPTCHA BYPASS TESTING
// ==========================================

function testCaptchaBypass() {
  const userId = `bypass_user_${__VU}_${__ITER}`;

  // Test 1: No CAPTCHA token
  const noTokenTest = generateTestPayload(userId, "none");
  noTokenTest.headers["X-Attack-Type"] = "no-captcha-token";

  const noTokenResponse = http.post(
    `${BASE_URL}/api/queue/join`,
    JSON.stringify(noTokenTest.payload),
    { headers: noTokenTest.headers }
  );

  check(noTokenResponse, {
    "No token - should be blocked": (r) => r.status !== 200,
  });

  if (noTokenResponse.status === 200) {
    captchaBypassRate.add(1);
    console.warn(`⚠️ CAPTCHA BYPASS: No token accepted for user ${userId}`);
  } else {
    captchaBypassRate.add(0);
  }

  noTokenAttempts.add(1);

  // Test 2: Invalid CAPTCHA token
  const invalidTokenTest = generateTestPayload(userId + "_invalid", "fake");
  invalidTokenTest.headers["X-Attack-Type"] = "invalid-captcha-token";

  const invalidTokenResponse = http.post(
    `${BASE_URL}/api/queue/join`,
    JSON.stringify(invalidTokenTest.payload),
    { headers: invalidTokenTest.headers }
  );

  check(invalidTokenResponse, {
    "Invalid token - should be blocked": (r) => r.status !== 200,
  });

  if (invalidTokenResponse.status === 200) {
    captchaBypassRate.add(1);
    console.warn(
      `⚠️ CAPTCHA BYPASS: Invalid token accepted for user ${userId}`
    );
  } else {
    captchaBypassRate.add(0);
  }

  invalidTokenAttempts.add(1);

  // Test 3: Empty CAPTCHA token
  const emptyTokenTest = generateTestPayload(userId + "_empty", "empty");
  emptyTokenTest.headers["X-Attack-Type"] = "empty-captcha-token";

  const emptyTokenResponse = http.post(
    `${BASE_URL}/api/queue/join`,
    JSON.stringify(emptyTokenTest.payload),
    { headers: emptyTokenTest.headers }
  );

  check(emptyTokenResponse, {
    "Empty token - should be blocked": (r) => r.status !== 200,
  });

  if (emptyTokenResponse.status === 200) {
    captchaBypassRate.add(1);
  } else {
    captchaBypassRate.add(0);
  }

  // Record response times
  captchaResponseTime.add(noTokenResponse.timings.duration);
  captchaResponseTime.add(invalidTokenResponse.timings.duration);
  captchaResponseTime.add(emptyTokenResponse.timings.duration);

  sleep(0.5);
}

// ==========================================
// CAPTCHA STRESS TESTING
// ==========================================

function testCaptchaStress() {
  const userId = `stress_user_${__VU}_${__ITER}`;
  const testData = generateTestPayload(userId, "valid");
  testData.headers["X-Attack-Type"] = "stress-test";

  const startTime = Date.now();

  const response = http.post(
    `${BASE_URL}/api/queue/join`,
    JSON.stringify(testData.payload),
    { headers: testData.headers }
  );

  const responseTime = Date.now() - startTime;
  captchaResponseTime.add(responseTime);

  const success = check(response, {
    "Stress test - response received": (r) => r.status > 0,
    "Stress test - reasonable response time": () => responseTime < 5000,
  });

  if (!success) {
    captchaValidationErrors.add(1);
  }

  sleep(0.1);
}

// ==========================================
// CAPTCHA VALIDATION TESTING
// ==========================================

function testCaptchaValidation() {
  const userId = `validation_user_${__VU}_${__ITER}`;

  // Test different token formats
  const tokenTypes = ["fake", "malformed", "empty", "none"];
  const tokenType = tokenTypes[Math.floor(Math.random() * tokenTypes.length)];

  const testData = generateTestPayload(userId, tokenType);
  testData.headers["X-Attack-Type"] = "validation-test";
  testData.headers["X-Token-Type"] = tokenType;

  const response = http.post(
    `${BASE_URL}/api/queue/join`,
    JSON.stringify(testData.payload),
    { headers: testData.headers }
  );

  captchaResponseTime.add(response.timings.duration);

  // Different expectations based on token type
  if (
    tokenType === "none" ||
    tokenType === "fake" ||
    tokenType === "empty" ||
    tokenType === "malformed"
  ) {
    // These should be blocked
    const blocked = check(response, {
      [`${tokenType} token - should be blocked`]: (r) => r.status !== 200,
    });

    if (!blocked) {
      captchaBypassRate.add(1);
      console.warn(`⚠️ VALIDATION BYPASS: ${tokenType} token accepted`);
    } else {
      captchaBypassRate.add(0);
    }

    captchaValidationErrors.add(1);
  }

  sleep(0.2);
}

// ==========================================
// SETUP AND TEARDOWN
// ==========================================

export function setup() {
  console.log("🚀 Starting CAPTCHA Security Tests...");
  console.log(`📊 Target: ${BASE_URL}`);
  console.log(`🛡️ CAPTCHA Enabled: ${CAPTCHA_ENABLED}`);
  console.log(`🔍 Scenario: ${__ENV.K6_SCENARIO || "captcha_bypass_attack"}`);

  // Test if CAPTCHA is actually enabled
  const testResponse = http.get(`${BASE_URL}/`);
  console.log(`📡 Server Status: ${testResponse.status}`);

  return { serverReady: testResponse.status === 200 };
}

export function teardown(data) {
  console.log("\n🏁 CAPTCHA Security Test Complete");
  console.log("📊 Check metrics for bypass attempts and validation errors");

  if (data.serverReady) {
    console.log("✅ Server was responsive during tests");
  } else {
    console.log("❌ Server was not responsive");
  }
}

// ==========================================
// CUSTOM CHECKS
// ==========================================

export function handleSummary(data) {
  const bypassRate = data.metrics.captcha_bypass_rate?.values?.rate || 0;
  const validationErrors =
    data.metrics.captcha_validation_errors?.values?.count || 0;
  const avgResponseTime = data.metrics.captcha_response_time?.values?.avg || 0;

  console.log("\n" + "=".repeat(50));
  console.log("🛡️ CAPTCHA SECURITY TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`🚨 Bypass Rate: ${(bypassRate * 100).toFixed(2)}%`);
  console.log(`⚠️ Validation Errors: ${validationErrors}`);
  console.log(`⏱️ Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);

  if (bypassRate === 0) {
    console.log("🎉 EXCELLENT! No CAPTCHA bypasses detected!");
  } else if (bypassRate < 0.1) {
    console.log("✅ GOOD! Low bypass rate detected.");
  } else {
    console.log("🚨 CRITICAL! High bypass rate - security issue!");
  }

  return {
    "captcha-security-report.json": JSON.stringify(data, null, 2),
  };
}
