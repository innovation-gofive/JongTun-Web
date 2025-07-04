// 🔴 CAPTCHA Bypass Attack Tests
// Red Team testing for CAPTCHA security vulnerabilities

console.log("🛡️ CAPTCHA Bypass Attack Tests Loaded");
console.log("Target: CAPTCHA security system in Dev War");
console.log("Testing: CAPTCHA bypass, manipulation, and evasion techniques");

// ==========================================
// CAPTCHA BYPASS ATTACK SCENARIOS
// ==========================================

const captchaBypassAttacks = {
  name: "CAPTCHA Security Tests",
  description: "Test CAPTCHA implementation against various bypass techniques",

  async execute() {
    console.log("🚀 Starting CAPTCHA Bypass Tests...");

    const attacks = [
      {
        name: "No CAPTCHA Token Attack",
        description: "Attempt to join queue without CAPTCHA verification",
        async test() {
          try {
            const response = await fetch("/api/queue/join", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Attack-Type": "no-captcha-token",
              },
              body: JSON.stringify({
                userId: "bypass_user_no_token",
                productId: "special-product",
                quantity: 1,
                // Intentionally omit X-Captcha-Token header
              }),
            });

            return {
              success: response.ok,
              status: response.status,
              message: response.ok
                ? "❌ BYPASSED - No CAPTCHA required!"
                : "✅ BLOCKED - CAPTCHA required",
              details: await response.text(),
            };
          } catch (error) {
            return {
              success: false,
              status: 0,
              message: "✅ BLOCKED - Network error",
              details: error.message,
            };
          }
        },
      },

      {
        name: "Invalid CAPTCHA Token Attack",
        description: "Submit invalid/fake CAPTCHA token",
        async test() {
          try {
            const response = await fetch("/api/queue/join", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Captcha-Token": "fake_invalid_token_12345",
                "X-Attack-Type": "invalid-captcha-token",
              },
              body: JSON.stringify({
                userId: "bypass_user_invalid_token",
                productId: "special-product",
                quantity: 1,
              }),
            });

            return {
              success: response.ok,
              status: response.status,
              message: response.ok
                ? "❌ BYPASSED - Invalid token accepted!"
                : "✅ BLOCKED - Invalid token rejected",
              details: await response.text(),
            };
          } catch (error) {
            return {
              success: false,
              status: 0,
              message: "✅ BLOCKED - Network error",
              details: error.message,
            };
          }
        },
      },

      {
        name: "Expired CAPTCHA Token Attack",
        description: "Submit old/expired CAPTCHA token",
        async test() {
          try {
            // Simulate an old token (Google test tokens are always valid)
            const expiredToken =
              "03AGdBq25SiQUQih2KO3PHON_Xl5N5LqV5VzQP8X8V8X8V8X8";

            const response = await fetch("/api/queue/join", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Captcha-Token": expiredToken,
                "X-Attack-Type": "expired-captcha-token",
              },
              body: JSON.stringify({
                userId: "bypass_user_expired_token",
                productId: "special-product",
                quantity: 1,
              }),
            });

            return {
              success: response.ok,
              status: response.status,
              message: response.ok
                ? "⚠️ ACCEPTED - Token validation may be weak"
                : "✅ BLOCKED - Expired token rejected",
              details: await response.text(),
            };
          } catch (error) {
            return {
              success: false,
              status: 0,
              message: "✅ BLOCKED - Network error",
              details: error.message,
            };
          }
        },
      },

      {
        name: "CAPTCHA Replay Attack",
        description: "Reuse the same CAPTCHA token multiple times",
        async test() {
          try {
            // First, try to get a valid token (in real test, this would be intercepted)
            const testToken = "valid_test_token_replay";

            const results = [];

            // Try to use the same token multiple times
            for (let i = 0; i < 3; i++) {
              const response = await fetch("/api/queue/join", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Captcha-Token": testToken,
                  "X-Attack-Type": "captcha-replay",
                },
                body: JSON.stringify({
                  userId: `bypass_user_replay_${i}`,
                  productId: "special-product",
                  quantity: 1,
                }),
              });

              results.push({
                attempt: i + 1,
                success: response.ok,
                status: response.status,
              });

              // Small delay between requests
              await new Promise((resolve) => setTimeout(resolve, 100));
            }

            const successfulReplays = results.filter((r) => r.success).length;

            return {
              success: successfulReplays > 1,
              status: 200,
              message:
                successfulReplays > 1
                  ? "❌ BYPASSED - Token reuse allowed!"
                  : "✅ BLOCKED - Token reuse prevented",
              details: `Successful replays: ${successfulReplays}/3`,
              results,
            };
          } catch (error) {
            return {
              success: false,
              status: 0,
              message: "✅ BLOCKED - Network error",
              details: error.message,
            };
          }
        },
      },

      {
        name: "CAPTCHA Header Manipulation",
        description: "Test various header manipulation techniques",
        async test() {
          try {
            const manipulations = [
              {
                name: "Missing Content-Type",
                headers: { "X-Captcha-Token": "test_token" },
              },
              {
                name: "Wrong Content-Type",
                headers: {
                  "Content-Type": "text/plain",
                  "X-Captcha-Token": "test_token",
                },
              },
              {
                name: "Multiple Captcha Headers",
                headers: {
                  "Content-Type": "application/json",
                  "X-Captcha-Token": "token1",
                  "X-CAPTCHA-TOKEN": "token2",
                  "captcha-token": "token3",
                },
              },
              {
                name: "Case Sensitivity Test",
                headers: {
                  "Content-Type": "application/json",
                  "x-captcha-token": "lowercase_header",
                },
              },
            ];

            const results = [];

            for (const manipulation of manipulations) {
              try {
                const response = await fetch("/api/queue/join", {
                  method: "POST",
                  headers: {
                    ...manipulation.headers,
                    "X-Attack-Type": "header-manipulation",
                  },
                  body: JSON.stringify({
                    userId: `bypass_user_header_${Date.now()}`,
                    productId: "special-product",
                    quantity: 1,
                  }),
                });

                results.push({
                  manipulation: manipulation.name,
                  success: response.ok,
                  status: response.status,
                });
              } catch (error) {
                results.push({
                  manipulation: manipulation.name,
                  success: false,
                  status: 0,
                  error: error.message,
                });
              }

              await new Promise((resolve) => setTimeout(resolve, 100));
            }

            const bypassed = results.filter((r) => r.success).length;

            return {
              success: bypassed > 0,
              status: 200,
              message:
                bypassed > 0
                  ? "❌ SOME BYPASSED - Header validation weak!"
                  : "✅ ALL BLOCKED - Header validation strong",
              details: `Bypassed: ${bypassed}/${results.length}`,
              results,
            };
          } catch (error) {
            return {
              success: false,
              status: 0,
              message: "✅ BLOCKED - Network error",
              details: error.message,
            };
          }
        },
      },

      {
        name: "CAPTCHA Environment Toggle Test",
        description:
          "Test if CAPTCHA can be disabled via client-side manipulation",
        async test() {
          try {
            // Check current CAPTCHA status
            const captchaEnabled =
              process.env.NEXT_PUBLIC_ENABLE_CAPTCHA === "true";

            console.log("🔍 CAPTCHA Environment Status:", {
              NEXT_PUBLIC_ENABLE_CAPTCHA:
                process.env.NEXT_PUBLIC_ENABLE_CAPTCHA,
              enabled: captchaEnabled,
            });

            // Try to manipulate environment (should not work in browser)
            const originalValue = process.env.NEXT_PUBLIC_ENABLE_CAPTCHA;

            try {
              // This should fail in browser environment
              process.env.NEXT_PUBLIC_ENABLE_CAPTCHA = "false";
              console.log("⚠️ Environment manipulation attempted");
            } catch (envError) {
              console.log(
                "✅ Environment manipulation blocked:",
                envError.message
              );
            }

            // Test if store can be manipulated
            let storeManipulated = false;
            try {
              // Try to access and manipulate the store
              if (window.useCaptchaStore) {
                const store = window.useCaptchaStore.getState();
                store.setEnabled(false);
                storeManipulated = true;
                console.log("⚠️ Store manipulation successful");
              }
            } catch (storeError) {
              console.log("✅ Store manipulation blocked:", storeError.message);
            }

            return {
              success: false, // This test is informational
              status: 200,
              message: storeManipulated
                ? "⚠️ WARNING - Store can be manipulated!"
                : "✅ SECURE - Environment controls protected",
              details: {
                originalEnv: originalValue,
                currentEnv: process.env.NEXT_PUBLIC_ENABLE_CAPTCHA,
                storeManipulated,
              },
            };
          } catch (error) {
            return {
              success: false,
              status: 0,
              message: "✅ SECURE - Environment protected",
              details: error.message,
            };
          }
        },
      },
    ];

    console.log("🔍 Running CAPTCHA security tests...");
    const results = [];

    for (const attack of attacks) {
      console.log(`\n🧪 Testing: ${attack.name}`);
      console.log(`📋 ${attack.description}`);

      try {
        const result = await attack.test();
        results.push({
          attack: attack.name,
          ...result,
        });

        console.log(`📊 Result: ${result.message}`);
        if (result.details) {
          console.log(`📝 Details:`, result.details);
        }
      } catch (error) {
        results.push({
          attack: attack.name,
          success: false,
          status: 0,
          message: "✅ BLOCKED - Test error",
          details: error.message,
        });
        console.log(`❌ Test error: ${error.message}`);
      }

      // Delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("🛡️ CAPTCHA SECURITY TEST SUMMARY");
    console.log("=".repeat(50));

    const bypassed = results.filter((r) => r.success).length;
    const total = results.length;
    const securityScore = Math.round(((total - bypassed) / total) * 100);

    console.log(
      `📊 Security Score: ${securityScore}% (${
        total - bypassed
      }/${total} blocked)`
    );
    console.log(`✅ Attacks Blocked: ${total - bypassed}`);
    console.log(`❌ Attacks Bypassed: ${bypassed}`);

    if (bypassed === 0) {
      console.log("🎉 EXCELLENT! All CAPTCHA bypass attempts were blocked!");
    } else if (bypassed <= 2) {
      console.log("⚠️ GOOD but needs improvement. Some vulnerabilities found.");
    } else {
      console.log("🚨 CRITICAL! Multiple CAPTCHA vulnerabilities detected!");
    }

    console.log("\n📋 Detailed Results:");
    results.forEach((result, index) => {
      const status = result.success ? "❌ BYPASSED" : "✅ BLOCKED";
      console.log(`${index + 1}. ${result.attack}: ${status}`);
    });

    return {
      securityScore,
      totalTests: total,
      bypassed,
      blocked: total - bypassed,
      results,
    };
  },
};

// ==========================================
// CAPTCHA STRESS TESTING
// ==========================================

const captchaStressTest = {
  name: "CAPTCHA Stress Test",
  description: "Test CAPTCHA performance under high load",

  async execute() {
    console.log("⚡ Starting CAPTCHA Stress Test...");

    const concurrentRequests = 50;
    const requests = [];

    // Create multiple concurrent requests with CAPTCHA
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        fetch("/api/queue/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Captcha-Token": "stress_test_token_" + i,
            "X-Stress-Test": "true",
          },
          body: JSON.stringify({
            userId: `stress_user_${i}`,
            productId: "special-product",
            quantity: 1,
          }),
        })
          .then((response) => ({
            success: response.ok,
            status: response.status,
            userId: `stress_user_${i}`,
          }))
          .catch((error) => ({
            success: false,
            status: 0,
            error: error.message,
            userId: `stress_user_${i}`,
          }))
      );
    }

    console.log(
      `🔥 Sending ${concurrentRequests} concurrent CAPTCHA requests...`
    );
    const startTime = Date.now();

    const results = await Promise.allSettled(requests);
    const endTime = Date.now();

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.filter(
      (r) => r.status === "rejected" || !r.value.success
    ).length;
    const duration = endTime - startTime;

    console.log("\n📊 CAPTCHA Stress Test Results:");
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`✅ Successful: ${successful}/${concurrentRequests}`);
    console.log(`❌ Failed: ${failed}/${concurrentRequests}`);
    console.log(
      `📈 Success Rate: ${Math.round((successful / concurrentRequests) * 100)}%`
    );
    console.log(
      `⚡ Requests/second: ${Math.round(
        (concurrentRequests / duration) * 1000
      )}`
    );

    return {
      duration,
      successful,
      failed,
      total: concurrentRequests,
      successRate: (successful / concurrentRequests) * 100,
    };
  },
};

// ==========================================
// EXPORT TEST SUITES
// ==========================================

// Make tests available globally for browser console
window.captchaSecurityTests = {
  bypassTests: captchaBypassAttacks,
  stressTest: captchaStressTest,

  // Run all tests
  async runAll() {
    console.log("🚀 Running Complete CAPTCHA Security Test Suite...\n");

    const bypassResults = await captchaBypassAttacks.execute();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const stressResults = await captchaStressTest.execute();

    console.log("\n" + "=".repeat(60));
    console.log("🏁 COMPLETE CAPTCHA SECURITY ASSESSMENT");
    console.log("=".repeat(60));
    console.log(`🛡️ Security Score: ${bypassResults.securityScore}%`);
    console.log(
      `⚡ Stress Performance: ${stressResults.successRate.toFixed(
        1
      )}% success rate`
    );

    return {
      bypass: bypassResults,
      stress: stressResults,
    };
  },
};

console.log("\n✅ CAPTCHA Security Tests Ready!");
console.log("🚀 Run tests using:");
console.log("   captchaSecurityTests.bypassTests.execute()");
console.log("   captchaSecurityTests.stressTest.execute()");
console.log("   captchaSecurityTests.runAll()");
