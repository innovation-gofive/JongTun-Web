import { NextRequest, NextResponse } from "next/server";
import {
  generateUserId,
  getQueuePosition,
  isUserAllowed,
  getQueueStats,
  mockQueue,
  mockAllowedUsers,
} from "@/lib/queue-utils";
import {
  QueueError,
  InvalidInputError,
  RetryManager,
  CircuitBreaker,
  FallbackQueueManager,
  validateInput,
  mockVerifyCSRF,
  logEvent,
} from "@/lib/error-handling";
import { autoQueueProcessor } from "@/lib/auto-queue-processor";

// Initialize Circuit Breaker for status operations
const statusCircuitBreaker = new CircuitBreaker(5, 15000); // 5 failures, 15s timeout
const fallbackManager = FallbackQueueManager.getInstance();

// Self-Service Queue Status API (No Admin Required)
export async function GET(request: NextRequest) {
  try {
    logEvent("STATUS_API_REQUEST", {
      method: "GET",
      timestamp: new Date().toISOString(),
    });

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const csrfToken = request.headers.get("X-CSRF-Token");

    // Generate user ID if not provided
    const actualUserId = userId || generateUserId(request);

    // Security: CSRF Protection (optional for GET requests)
    if (csrfToken) {
      mockVerifyCSRF(csrfToken);
    }

    // Input validation
    if (userId) {
      validateInput(
        { userId },
        {
          userId: (v: unknown) => typeof v === "string" && v.length > 0,
        }
      );
    }

    // Use Circuit Breaker for status operations
    const result = await statusCircuitBreaker.execute(async () => {
      return await RetryManager.withRetry(async () => {
        // Auto-start queue processor if not running (Self-Service Mode)
        if (!autoQueueProcessor.getStatus().isRunning) {
          autoQueueProcessor.start();
          logEvent("AUTO_QUEUE_PROCESSOR_STARTED", {
            reason: "Status check triggered auto-start",
            userId: actualUserId,
          });
        }

        // Check if fallback mode is active
        if (fallbackManager.isInFallbackMode()) {
          logEvent("FALLBACK_MODE_STATUS_CHECK", {
            fallbackQueueSize: fallbackManager.getFallbackQueueSize(),
            userId: actualUserId,
          });

          return {
            success: true,
            data: {
              userId: actualUserId,
              position: fallbackManager.getFallbackQueuePosition(actualUserId),
              estimatedWaitMinutes: Math.max(
                5,
                fallbackManager.getFallbackQueueSize() * 2
              ),
              totalInQueue: fallbackManager.getFallbackQueueSize(),
              isAllowed: false,
              isInQueue: true,
              joinedAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              status: "waiting",
              message: "System is in fallback mode - please wait",
              systemMode: "fallback",
              autoProcessing: false,
            },
          };
        }

        // Get real queue status for Self-Service mode
        const position = getQueuePosition(actualUserId);
        const isAllowed = isUserAllowed(actualUserId);
        const stats = getQueueStats();
        const autoStatus = autoQueueProcessor.getStatus();

        // Determine user status
        let status: string;
        let message: string;
        let isInQueue: boolean;

        if (isAllowed) {
          status = "allowed";
          message = "You are now allowed to proceed to product selection";
          isInQueue = false;
        } else if (position && position > 0) {
          status = "waiting";
          message = `You are in position ${position} of ${stats.totalInQueue}`;
          isInQueue = true;
        } else {
          status = "not_in_queue";
          message = "You are not currently in the queue";
          isInQueue = false;
        }

        const responseData = {
          userId: actualUserId,
          position: position && position > 0 ? position : null,
          estimatedWaitMinutes:
            position && position > 0
              ? Math.max(1, Math.ceil(position * 0.5))
              : null,
          totalInQueue: stats.totalInQueue,
          allowedUsers: stats.allowedUsers,
          isAllowed,
          isInQueue,
          joinedAt: stats.oldestInQueue,
          lastUpdated: new Date().toISOString(),
          status,
          message,
          systemMode: "self-service",
          autoProcessing: {
            enabled: autoStatus.isRunning,
            config: autoStatus.config,
            nextProcessingIn: autoStatus.config.processingInterval,
            isWithinBusinessHours: autoStatus.isWithinBusinessHours,
          },
        };

        logEvent("QUEUE_STATUS_SUCCESS", {
          userId: actualUserId,
          position,
          status,
          autoProcessing: autoStatus.isRunning,
        });

        return {
          success: true,
          data: responseData,
        };
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    logEvent("STATUS_API_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          message: error.message,
        },
        { status: 400 }
      );
    }

    if (error instanceof QueueError) {
      return NextResponse.json(
        {
          success: false,
          error: "Queue error",
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Fallback response for unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred",
        fallbackMode: fallbackManager.isInFallbackMode(),
      },
      { status: 500 }
    );
  }
}

// Self-Service Queue Status Update API (Leave Queue / Update Status)
export async function POST(request: NextRequest) {
  try {
    logEvent("STATUS_UPDATE_REQUEST", {
      method: "POST",
      timestamp: new Date().toISOString(),
    });

    const body = await request.json();
    const csrfToken = request.headers.get("X-CSRF-Token");

    // Security: CSRF Protection
    mockVerifyCSRF(csrfToken || undefined);

    // Input validation
    validateInput(body, {
      userId: (v: unknown) => typeof v === "string" && v.length > 0,
      action: (v: unknown) =>
        typeof v === "string" && ["leave", "refresh", "ping"].includes(v),
    });

    const { userId, action } = body;

    // Use Circuit Breaker for status update operations
    const result = await statusCircuitBreaker.execute(async () => {
      return await RetryManager.withRetry(async () => {
        // Ensure auto-processor is running
        if (!autoQueueProcessor.getStatus().isRunning) {
          autoQueueProcessor.start();
          logEvent("AUTO_QUEUE_PROCESSOR_STARTED", {
            reason: "Status update triggered auto-start",
            userId,
            action,
          });
        }

        switch (action) {
          case "leave":
            logEvent("QUEUE_LEAVE_REQUEST", { userId });

            // Remove user from queue and allowed users
            const queueIndex = mockQueue.findIndex(
              (user) => user.userId === userId
            );
            if (queueIndex !== -1) {
              mockQueue.splice(queueIndex, 1);
            }
            mockAllowedUsers.delete(userId);

            const leaveResult = {
              success: true,
              message: "Successfully left the queue",
              userId,
              leftAt: new Date().toISOString(),
              remainingInQueue: mockQueue.length,
              systemMode: "self-service",
            };

            logEvent("QUEUE_LEFT_SUCCESS", {
              userId,
              remainingInQueue: mockQueue.length,
            });

            return leaveResult;

          case "refresh":
          case "ping":
            logEvent("QUEUE_REFRESH_REQUEST", { userId, action });

            // Return current status without making changes
            const position = getQueuePosition(userId);
            const isAllowed = isUserAllowed(userId);
            const stats = getQueueStats();

            const refreshResult = {
              success: true,
              message: "Queue status refreshed",
              userId,
              position: position && position > 0 ? position : null,
              isAllowed,
              isInQueue: position !== null && position > 0,
              totalInQueue: stats.totalInQueue,
              allowedUsers: stats.allowedUsers,
              updatedAt: new Date().toISOString(),
              systemMode: "self-service",
              autoProcessing: autoQueueProcessor.getStatus().isRunning,
            };

            return refreshResult;

          default:
            throw new InvalidInputError(`Unknown action: ${action}`);
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    logEvent("STATUS_UPDATE_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          message: error.message,
        },
        { status: 400 }
      );
    }

    if (error instanceof QueueError) {
      return NextResponse.json(
        {
          success: false,
          error: "Queue error",
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Fallback response for unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred",
        fallbackMode: fallbackManager.isInFallbackMode(),
      },
      { status: 500 }
    );
  }
}
