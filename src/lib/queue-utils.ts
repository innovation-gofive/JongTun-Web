// Queue utility functions for backend simulation
// In production, these will be replaced with actual backend API calls

import { CONSTANTS } from "@/lib/constants";

// Simple in-memory queue for demo (replacing Redis)
export const mockQueue: Array<{ userId: string; joinedAt: number }> = [];
export const mockAllowedUsers: Set<string> = new Set();

// Rate limiting for demo
export const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

// Configuration - Using centralized constants
export const MAX_QUEUE_SIZE = CONSTANTS.QUEUE.MAX_SIZE;
export const RATE_LIMIT_WINDOW = CONSTANTS.QUEUE.RATE_LIMIT_WINDOW;
export const RATE_LIMIT_MAX_REQUESTS = CONSTANTS.QUEUE.RATE_LIMIT_MAX_REQUESTS;

// Simple rate limiter
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  resetTime?: number;
} {
  const now = Date.now();
  const key = identifier;

  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: existing.resetTime };
  }

  existing.count++;
  return { allowed: true };
}

// Generate user ID from IP and user agent
export function generateUserId(request: Request): string {
  const userAgent = request.headers.get("user-agent") || "unknown";
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");

  // Try to get IP from various headers
  const ip = xForwardedFor?.split(",")[0] || xRealIp || "unknown";

  // Create hash from IP + user agent
  const identifier = `${ip}-${userAgent}`;
  return btoa(identifier).slice(0, 16);
}

// Add user to queue
export function addToQueue(userId: string): boolean {
  // Check if already in queue
  if (mockQueue.some((user) => user.userId === userId)) {
    return false;
  }

  // Check if already allowed
  if (mockAllowedUsers.has(userId)) {
    return true;
  }

  // Check queue size
  if (mockQueue.length >= MAX_QUEUE_SIZE) {
    return false;
  }

  mockQueue.push({ userId, joinedAt: Date.now() });
  return true;
}

// Get user's position in queue
export function getQueuePosition(userId: string): number | null {
  const index = mockQueue.findIndex((user) => user.userId === userId);
  return index >= 0 ? index + 1 : null;
}

// Check if user is allowed
export function isUserAllowed(userId: string): boolean {
  return mockAllowedUsers.has(userId);
}

// Auto-processing function (แทนที่ manual admin)
export function processQueue(count: number = 1) {
  const processed = mockQueue.splice(0, count);
  processed.forEach((user) => {
    mockAllowedUsers.add(user.userId);
  });
  return {
    processedCount: processed.length,
    remainingInQueue: mockQueue.length,
    processedUsers: processed.map((u) => u.userId),
  };
}

// Get queue statistics for monitoring
export function getQueueStats() {
  return {
    totalInQueue: mockQueue.length,
    allowedUsers: mockAllowedUsers.size,
    oldestInQueue: mockQueue.length > 0 ? mockQueue[0].joinedAt : null,
  };
}

// Clean up expired allowed users (สำหรับ auto-cleanup)
export function cleanupExpiredUsers() {
  let cleanedCount = 0;

  // Note: ในระบบจริงควรเก็บ timestamp ของการ allow
  // ตอนนี้จะใช้วิธีง่ายๆ คือ reset เมื่อเรียกใช้
  if (mockAllowedUsers.size > 0) {
    cleanedCount = mockAllowedUsers.size;
    mockAllowedUsers.clear();
  }

  return {
    cleanedCount,
    message: `Cleaned up ${cleanedCount} expired user sessions`,
  };
}
