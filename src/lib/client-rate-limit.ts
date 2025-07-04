// Client-side Rate Limiting Hook
// ป้องกัน API Flood และ Spam attacks

import { useRef, useCallback } from "react";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitResult {
  canProceed: boolean;
  remainingRequests: number;
  resetTime: number;
  isBlocked: boolean;
}

export const useClientRateLimit = (
  config: RateLimitConfig
): {
  checkRateLimit: (key?: string) => RateLimitResult;
  reset: (key?: string) => void;
} => {
  const requestHistory = useRef<Map<string, number[]>>(new Map());
  const blockedUntil = useRef<Map<string, number>>(new Map());

  const checkRateLimit = useCallback(
    (key = "default"): RateLimitResult => {
      const now = Date.now();

      // Check if currently blocked
      const blockTime = blockedUntil.current.get(key) || 0;
      if (now < blockTime) {
        return {
          canProceed: false,
          remainingRequests: 0,
          resetTime: blockTime,
          isBlocked: true,
        };
      }

      // Get request history for this key
      const history = requestHistory.current.get(key) || [];

      // Remove old requests outside the window
      const windowStart = now - config.windowMs;
      const recentRequests = history.filter((time) => time > windowStart);

      // Check if under limit
      if (recentRequests.length < config.maxRequests) {
        // Add current request
        recentRequests.push(now);
        requestHistory.current.set(key, recentRequests);

        return {
          canProceed: true,
          remainingRequests: config.maxRequests - recentRequests.length,
          resetTime: now + config.windowMs,
          isBlocked: false,
        };
      }

      // Rate limit exceeded - block if configured
      if (config.blockDurationMs) {
        const blockUntil = now + config.blockDurationMs;
        blockedUntil.current.set(key, blockUntil);
      }

      return {
        canProceed: false,
        remainingRequests: 0,
        resetTime: recentRequests[0] + config.windowMs,
        isBlocked: false,
      };
    },
    [config]
  );

  const reset = useCallback((key = "default") => {
    requestHistory.current.delete(key);
    blockedUntil.current.delete(key);
  }, []);

  return { checkRateLimit, reset };
};
