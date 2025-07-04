import { NextRequest, NextResponse } from "next/server";
import {
  generateUserId,
  addToQueue,
  getQueuePosition,
  isUserAllowed,
  checkRateLimit,
  mockQueue,
  mockAllowedUsers,
} from "@/lib/queue-utils";
import {
  QueueError,
  RetryManager,
  CircuitBreaker,
  FallbackQueueManager,
  mockVerifyCSRF,
  logEvent,
} from "@/lib/error-handling";
import { autoQueueProcessor } from "@/lib/auto-queue-processor";

// Initialize Circuit Breaker for join operations
const joinCircuitBreaker = new CircuitBreaker(5, 30000); // 5 failures, 30s timeout
const fallbackManager = FallbackQueueManager.getInstance();

// Auto-start queue processor (Self-Service Mode)
if (typeof window === "undefined") {
  // Server-side only
  try {
    autoQueueProcessor.start();
    console.log("🚀 Auto-queue processor started - Self-Service Mode enabled");
  } catch (error) {
    console.error("Failed to start auto-queue processor:", error);
  }
}

// Queue Join API
export async function POST(request: NextRequest) {
  try {
    logEvent("QUEUE_JOIN_REQUEST", {
      method: "POST",
      timestamp: new Date().toISOString(),
    });

    const csrfToken = request.headers.get("X-CSRF-Token");
    const captchaToken = request.headers.get("X-Captcha-Token");

    // Security: CSRF Protection
    mockVerifyCSRF(csrfToken || undefined);

    // Phase 2: CAPTCHA Verification (fail-safe)
    if (captchaToken) {
      try {
        const { verifyCaptchaToken } = await import("@/lib/captcha");
        const clientIP =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";

        const verification = await verifyCaptchaToken(captchaToken, clientIP);

        logEvent("CAPTCHA_VERIFICATION", {
          success: verification.success,
          score: verification.score,
          error: verification.error,
        });

        // Note: We don't fail the request if CAPTCHA fails - just log it
        // This ensures fail-open behavior during Phase 2
        if (!verification.success) {
          console.warn("CAPTCHA verification failed:", verification.error);
        }
      } catch (error) {
        // CAPTCHA verification error - proceed anyway (fail-open)
        console.warn("CAPTCHA verification error:", error);
      }
    }

    // Generate user ID from request
    const userId = generateUserId(request);

    // Rate limiting
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      logEvent("QUEUE_JOIN_RATE_LIMITED", { userId });
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message:
            "Too many requests. Please wait a moment before trying again.",
          resetTime: rateLimitCheck.resetTime,
        },
        { status: 429 }
      );
    }

    // Use Circuit Breaker for join operations
    const result = await joinCircuitBreaker.execute(async () => {
      return await RetryManager.withRetry(async () => {
        // Check if user is already allowed
        if (isUserAllowed(userId)) {
          logEvent("QUEUE_JOIN_ALREADY_ALLOWED", { userId });
          return {
            success: true,
            status: "allowed",
            message: "You are already allowed to proceed",
            userId,
            joinedAt: new Date().toISOString(),
          };
        }

        // Check if in fallback mode
        if (fallbackManager.isInFallbackMode()) {
          logEvent("QUEUE_JOIN_FALLBACK_MODE", { userId });
          fallbackManager.addToFallbackQueue(userId);

          const fallbackPosition =
            fallbackManager.getFallbackQueuePosition(userId);
          return {
            success: true,
            status: "waiting",
            position: fallbackPosition,
            totalInQueue: fallbackManager.getFallbackQueueSize(),
            estimatedWaitMinutes: Math.ceil((fallbackPosition || 1) * 2), // 2 minutes per position
            message: "You have been added to the queue (fallback mode)",
            userId,
            joinedAt: new Date().toISOString(),
            fallbackMode: true,
          };
        }

        // AUTO-APPROVE LOGIC: Check if user should be allowed immediately
        // If queue is empty or user is first in line, allow immediately
        if (mockQueue.length === 0 || mockAllowedUsers.size < 3) {
          // Auto-approve if queue is empty or we have room for more users
          mockAllowedUsers.add(userId);
          logEvent("QUEUE_JOIN_AUTO_APPROVED", {
            userId,
            reason: "auto_approval",
          });

          return {
            success: true,
            status: "allowed",
            message: "You have been automatically approved to proceed",
            userId,
            joinedAt: new Date().toISOString(),
            autoApproved: true,
          };
        }

        // Try to add to queue
        const addedToQueue = addToQueue(userId);

        if (!addedToQueue) {
          // Queue might be full or user already in queue
          const position = getQueuePosition(userId);

          if (position) {
            // User is already in queue
            logEvent("QUEUE_JOIN_ALREADY_IN_QUEUE", { userId, position });

            // Create deterministic values based on userId to avoid hydration mismatch
            const userHash = userId
              .split("")
              .reduce((a, b) => a + b.charCodeAt(0), 0);
            const mockTotal = position + (userHash % 10) + 5; // Deterministic mock total

            return {
              success: true,
              status: "waiting",
              position,
              totalInQueue: mockTotal,
              estimatedWaitMinutes: Math.ceil(position * 2), // 2 minutes per position
              message: "You are already in the queue",
              userId,
              joinedAt: new Date().toISOString(),
              fallbackMode: false,
            };
          } else {
            // Queue is full
            logEvent("QUEUE_JOIN_QUEUE_FULL", { userId });
            throw new QueueError(
              "Queue is currently full. Please try again later.",
              "QUEUE_FULL",
              503
            );
          }
        }

        // Successfully added to queue
        const position = getQueuePosition(userId);
        logEvent("QUEUE_JOIN_SUCCESS", { userId, position });

        // Create deterministic values based on userId to avoid hydration mismatch
        const userHash = userId
          .split("")
          .reduce((a, b) => a + b.charCodeAt(0), 0);
        const mockTotal = (position || 1) + (userHash % 10) + 5; // Deterministic mock total

        return {
          success: true,
          status: "waiting",
          position,
          totalInQueue: mockTotal,
          estimatedWaitMinutes: Math.ceil((position || 1) * 2), // 2 minutes per position
          message: "You have been added to the queue",
          userId,
          joinedAt: new Date().toISOString(),
          fallbackMode: false,
        };
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    logEvent("QUEUE_JOIN_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    if (error instanceof QueueError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Enable fallback mode if circuit breaker opens
    if (
      error instanceof Error &&
      error.message.includes("Circuit breaker is open")
    ) {
      fallbackManager.enableFallback();
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while joining the queue",
        fallbackMode: fallbackManager.isInFallbackMode(),
      },
      { status: 500 }
    );
  }
}

// Get queue status for a user
export async function GET(request: NextRequest) {
  try {
    logEvent("QUEUE_STATUS_REQUEST", {
      method: "GET",
      timestamp: new Date().toISOString(),
    });

    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");

    // Generate user ID from request if not provided
    const userId = userIdParam || generateUserId(request);

    // Check user status
    if (isUserAllowed(userId)) {
      return NextResponse.json({
        success: true,
        status: "allowed",
        message: "You are allowed to proceed",
        userId,
      });
    }

    const position = getQueuePosition(userId);
    if (position) {
      // Create deterministic values based on userId to avoid hydration mismatch
      const userHash = userId
        .split("")
        .reduce((a, b) => a + b.charCodeAt(0), 0);
      const mockTotal = position + (userHash % 10) + 5; // Deterministic mock total

      return NextResponse.json({
        success: true,
        status: "waiting",
        position,
        totalInQueue: mockTotal,
        estimatedWaitMinutes: Math.ceil(position * 2),
        message: "You are currently in the queue",
        userId,
      });
    }

    return NextResponse.json({
      success: true,
      status: "not_in_queue",
      message: "You are not currently in the queue",
      userId,
    });
  } catch (error) {
    logEvent("QUEUE_STATUS_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while checking queue status",
      },
      { status: 500 }
    );
  }
}
