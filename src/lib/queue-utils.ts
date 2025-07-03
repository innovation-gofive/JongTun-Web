// Mock Queue Utils - No longer using Redis
// In the future, this will call APIs to Backend instead

// NOTE: This file is no longer used as we moved to Mock API
// located in /api/queue/status/route.ts instead

export const DEPRECATED_MESSAGE =
  "This file is deprecated. Use /api/queue/status/route.ts instead";

console.warn(DEPRECATED_MESSAGE);

// Mock functions to prevent errors in files that still reference them
export async function processQueue() {
  console.warn("processQueue is deprecated. Use API endpoint instead.");
  return {
    processed: 0,
    message: "Please use /api/queue/admin endpoint instead",
  };
}

export async function cleanupQueue() {
  console.warn("cleanupQueue is deprecated. Use API endpoint instead.");
  return {
    cleaned: 0,
    message: "Please use /api/queue/admin endpoint instead",
  };
}

export async function getQueueStats() {
  console.warn("getQueueStats is deprecated. Use API endpoint instead.");
  return {
    totalLength: 0,
    validItems: 0,
    oldestWaitTime: 0,
    averageWaitTime: 0,
    message: "Please use /api/queue/admin endpoint instead",
  };
}
