// 🔴 Red Team Attack Scripts
// Scripts for testing security vulnerabilities in the Dev War reservation system

console.log("🔴 Red Team Attack Scripts Loaded");
console.log("Target: Dev War Reservation System");
console.log("Testing: Load, Spam, Bypass, API Failure scenarios");

// ==========================================
// 1. LOAD TESTING - Simulate 1000+ users
// ==========================================

const loadTestAttack = {
  name: "Load Testing Attack",
  description: "Simulate heavy concurrent load to test system limits",

  async execute() {
    console.log("🚀 Starting Load Test Attack...");

    const concurrentUsers = 1000;
    const requests = [];

    // Create multiple concurrent API requests
    for (let i = 0; i < concurrentUsers; i++) {
      requests.push(
        fetch("/api/queue/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: `load_test_user_${i}`,
            productId: "special-product",
            quantity: Math.floor(Math.random() * 5) + 1,
          }),
        }).catch((err) => ({
          error: err.message,
          userId: `load_test_user_${i}`,
        }))
      );
    }

    console.log(`📊 Sending ${concurrentUsers} concurrent requests...`);
    const startTime = Date.now();

    try {
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      console.log("📈 Load Test Results:");
      console.log(`- Total requests: ${concurrentUsers}`);
      console.log(`- Successful: ${successful}`);
      console.log(`- Failed: ${failed}`);
      console.log(`- Duration: ${endTime - startTime}ms`);
      console.log(
        `- Requests/sec: ${(
          concurrentUsers /
          ((endTime - startTime) / 1000)
        ).toFixed(2)}`
      );

      return { successful, failed, duration: endTime - startTime };
    } catch (error) {
      console.error("❌ Load test failed:", error);
      return null;
    }
  },
};

// ==========================================
// 2. API FLOOD/SPAM ATTACK
// ==========================================

const apiSpamAttack = {
  name: "API Spam Attack",
  description:
    "Flood API endpoints with rapid requests to bypass rate limiting",

  async execute() {
    console.log("🌊 Starting API Spam Attack...");

    const endpoints = [
      "/api/queue/status",
      "/api/queue/monitor",
      "/api/branches",
      "/api/products",
    ];

    const spamRounds = 50;
    const delayMs = 10; // Very rapid requests

    for (const endpoint of endpoints) {
      console.log(`🎯 Spamming ${endpoint}...`);

      const promises = [];
      for (let i = 0; i < spamRounds; i++) {
        promises.push(
          new Promise((resolve) => {
            setTimeout(async () => {
              try {
                const response = await fetch(endpoint, {
                  method: "GET",
                  headers: {
                    "User-Agent": `RedTeamBot-${i}`,
                    "X-Attack-Vector": "api-spam",
                  },
                });
                resolve({
                  status: response.status,
                  endpoint,
                  round: i,
                  headers: Object.fromEntries(response.headers.entries()),
                });
              } catch (error) {
                resolve({ error: error.message, endpoint, round: i });
              }
            }, i * delayMs);
          })
        );
      }

      const results = await Promise.all(promises);
      const successful = results.filter(
        (r) => r.status && r.status < 400
      ).length;
      const rateLimited = results.filter((r) => r.status === 429).length;

      console.log(`📊 Spam results for ${endpoint}:`);
      console.log(`- Successful: ${successful}/${spamRounds}`);
      console.log(`- Rate limited (429): ${rateLimited}`);
      console.log(
        `- Rate limit effectiveness: ${(
          (rateLimited / spamRounds) *
          100
        ).toFixed(1)}%`
      );
    }
  },
};

// ==========================================
// 3. QUEUE BYPASS ATTACK
// ==========================================

const queueBypassAttack = {
  name: "Queue Bypass Attack",
  description: "Attempt to bypass queue system and access protected resources",

  async execute() {
    console.log("🚪 Starting Queue Bypass Attack...");

    const bypassAttempts = [
      {
        name: "Direct Branch Selection",
        url: "/select-branch",
        method: "GET",
      },
      {
        name: "Direct Confirmation Access",
        url: "/confirmation",
        method: "GET",
      },
      {
        name: "Queue Status Manipulation",
        url: "/api/queue/status",
        method: "POST",
        body: { forceStatus: "confirmed", bypassQueue: true },
      },
      {
        name: "Local Storage Manipulation",
        action: () => {
          // Attempt to manipulate client-side state
          localStorage.setItem("queue-status", "confirmed");
          localStorage.setItem("reservation-id", "BYPASS_" + Date.now());
          localStorage.setItem("selected-branch", "downtown");
          console.log("🔧 Local storage manipulation completed");
        },
      },
      {
        name: "Multi-tab Session Hijacking",
        action: () => {
          // Open multiple tabs to test cross-tab protection
          const tabs = [];
          for (let i = 0; i < 5; i++) {
            const tab = window.open(window.location.href, `bypass_tab_${i}`);
            tabs.push(tab);
          }
          console.log(`🪟 Opened ${tabs.length} bypass tabs`);

          // Close tabs after test
          setTimeout(() => {
            tabs.forEach((tab) => tab && tab.close());
          }, 5000);
        },
      },
    ];

    const results = [];

    for (const attempt of bypassAttempts) {
      console.log(`🎯 Attempting: ${attempt.name}`);

      try {
        if (attempt.action) {
          attempt.action();
          results.push({ name: attempt.name, status: "executed" });
        } else {
          const response = await fetch(attempt.url, {
            method: attempt.method,
            headers: {
              "Content-Type": "application/json",
              "X-Bypass-Attempt": "true",
            },
            body: attempt.body ? JSON.stringify(attempt.body) : undefined,
          });

          results.push({
            name: attempt.name,
            status: response.status,
            bypassed: response.status === 200,
          });
        }
      } catch (error) {
        results.push({
          name: attempt.name,
          error: error.message,
          bypassed: false,
        });
      }
    }

    console.log("📊 Queue Bypass Results:");
    results.forEach((result) => {
      console.log(
        `- ${result.name}: ${result.bypassed ? "❌ BYPASSED" : "✅ BLOCKED"}`
      );
    });

    return results;
  },
};

// ==========================================
// 4. API FAILURE SIMULATION
// ==========================================

const apiFailureAttack = {
  name: "API Failure Attack",
  description: "Test system resilience against external API failures",

  async execute() {
    console.log("💥 Starting API Failure Simulation...");

    // Simulate various API failure scenarios
    const failureScenarios = [
      {
        name: "Network Timeout",
        simulate: () => {
          // Mock fetch to simulate timeout
          const originalFetch = window.fetch;
          window.fetch = async (...args) => {
            await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s timeout
            return originalFetch(...args);
          };

          setTimeout(() => {
            window.fetch = originalFetch;
          }, 5000);
        },
      },
      {
        name: "Server Error 500",
        simulate: () => {
          const originalFetch = window.fetch;
          window.fetch = async () => {
            return new Response(
              JSON.stringify({ error: "Internal Server Error" }),
              {
                status: 500,
                statusText: "Internal Server Error",
                headers: { "Content-Type": "application/json" },
              }
            );
          };

          setTimeout(() => {
            window.fetch = originalFetch;
          }, 5000);
        },
      },
      {
        name: "Network Disconnection",
        simulate: () => {
          // Simulate offline status
          Object.defineProperty(navigator, "onLine", {
            writable: true,
            value: false,
          });

          window.dispatchEvent(new Event("offline"));

          setTimeout(() => {
            Object.defineProperty(navigator, "onLine", {
              writable: true,
              value: true,
            });
            window.dispatchEvent(new Event("online"));
          }, 5000);
        },
      },
    ];

    for (const scenario of failureScenarios) {
      console.log(`💣 Testing: ${scenario.name}`);

      scenario.simulate();

      // Test system behavior during failure
      try {
        await fetch("/api/queue/status");
        console.log(`✅ System handled ${scenario.name} gracefully`);
      } catch (error) {
        console.log(
          `❌ System failed during ${scenario.name}: ${error.message}`
        );
      }

      // Wait for recovery
      await new Promise((resolve) => setTimeout(resolve, 6000));
    }
  },
};

// ==========================================
// 5. FORM MANIPULATION ATTACK
// ==========================================

const formManipulationAttack = {
  name: "Form Manipulation Attack",
  description: "Test client-side validation bypass",

  async execute() {
    console.log("📝 Starting Form Manipulation Attack...");

    const manipulations = [
      {
        name: "Quantity Overflow",
        test: () => {
          // Try to set extremely large quantity
          const quantityField = document.querySelector('[name="quantity"]');
          if (quantityField) {
            quantityField.value = "999999";
            quantityField.dispatchEvent(new Event("change"));
          }
        },
      },
      {
        name: "Negative Quantity",
        test: () => {
          const quantityField = document.querySelector('[name="quantity"]');
          if (quantityField) {
            quantityField.value = "-10";
            quantityField.dispatchEvent(new Event("change"));
          }
        },
      },
      {
        name: "Invalid Branch ID",
        test: () => {
          // Attempt to inject invalid branch data
          localStorage.setItem(
            "selected-branch-id",
            "INVALID_BRANCH_XSS<script>alert(1)</script>"
          );
        },
      },
      {
        name: "State Store Manipulation",
        test: () => {
          // Try to directly manipulate Zustand store if accessible
          if (window.__ZUSTAND_STORES__) {
            console.log("🎯 Found Zustand stores, attempting manipulation...");
            // This would need to be customized based on actual store structure
          }
        },
      },
    ];

    manipulations.forEach((manipulation) => {
      console.log(`🔧 Testing: ${manipulation.name}`);
      try {
        manipulation.test();
        console.log(`✅ ${manipulation.name} executed`);
      } catch (error) {
        console.log(`❌ ${manipulation.name} blocked: ${error.message}`);
      }
    });
  },
};

// ==========================================
// MAIN ATTACK CONTROLLER
// ==========================================

const RedTeamAttacker = {
  attacks: [
    loadTestAttack,
    apiSpamAttack,
    queueBypassAttack,
    apiFailureAttack,
    formManipulationAttack,
  ],

  async runAllAttacks() {
    console.log("🔥 RED TEAM ATTACK SEQUENCE INITIATED");
    console.log("=".repeat(50));

    const results = {};

    for (const attack of this.attacks) {
      console.log(`\n🎯 Executing: ${attack.name}`);
      console.log(`📝 Description: ${attack.description}`);
      console.log("-".repeat(30));

      try {
        const result = await attack.execute();
        results[attack.name] = { success: true, result };
        console.log(`✅ ${attack.name} completed`);
      } catch (error) {
        results[attack.name] = { success: false, error: error.message };
        console.log(`❌ ${attack.name} failed: ${error.message}`);
      }

      // Wait between attacks
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("\n" + "=".repeat(50));
    console.log("🔴 RED TEAM ATTACK SUMMARY");
    console.log("=".repeat(50));

    Object.entries(results).forEach(([attackName, result]) => {
      console.log(`${result.success ? "✅" : "❌"} ${attackName}`);
    });

    return results;
  },

  async runSingleAttack(attackName) {
    const attack = this.attacks.find((a) =>
      a.name.toLowerCase().includes(attackName.toLowerCase())
    );

    if (!attack) {
      console.log(`❌ Attack "${attackName}" not found`);
      return;
    }

    console.log(`🎯 Running single attack: ${attack.name}`);
    return await attack.execute();
  },
};

// Export for global access
window.RedTeamAttacker = RedTeamAttacker;

console.log("🔴 Red Team Attack Scripts Ready!");
console.log("Usage:");
console.log("- RedTeamAttacker.runAllAttacks() - Run all attacks");
console.log("- RedTeamAttacker.runSingleAttack('load') - Run specific attack");
console.log(
  "- Available attacks:",
  RedTeamAttacker.attacks.map((a) => a.name).join(", ")
);
