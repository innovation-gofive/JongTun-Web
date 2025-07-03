import { NextRequest, NextResponse } from "next/server";
import {
  mockQueue,
  mockAllowedUsers,
  MAX_QUEUE_SIZE,
  checkRateLimit,
  generateUserId,
} from "@/lib/queue-utils";

// Mock API configuration for simulating backend queue system
// In production, these APIs will call to Backend Server
const MOCK_BACKEND_CONFIG = {
  baseUrl: process.env.BACKEND_API_URL || "https://api.example.com",
  endpoints: {
    joinQueue: "/api/queue/join",
    checkStatus: "/api/queue/status",
    getStats: "/api/queue/stats",
  },
};

// Mock function for calling Backend API (in the future)
async function callBackendAPI(
  endpoint: string,
  data?: Record<string, unknown>
): Promise<{ success: boolean; mock: boolean }> {
  // In production, this will call fetch() to Backend
  // const response = await fetch(`${MOCK_BACKEND_CONFIG.baseUrl}${endpoint}`, {
  //   method: data ? 'POST' : 'GET',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: data ? JSON.stringify(data) : undefined
  // });
  // return response.json();

  // Mock response for demo
  console.log(`[MOCK] Backend API call: ${endpoint}`, data);
  return { success: true, mock: true };
}

interface QueueResponse {
  status: "allowed" | "waiting" | "rate_limited";
  position?: number;
  totalInQueue?: number;
  estimatedWaitMinutes?: number;
  message?: string;
}

// POST: Join queue
export async function POST(request: NextRequest) {
  try {
    const userId = generateUserId(request);

    // Check rate limit
    const { allowed, resetTime } = checkRateLimit(userId);

    if (!allowed) {
      return NextResponse.json(
        {
          status: "rate_limited",
          message: `Too many requests. Please wait and try again. Reset at ${new Date(
            resetTime!
          ).toLocaleString("en-US")}`,
        } as QueueResponse,
        { status: 429 }
      );
    }

    // Call Mock Backend API (will be real API in the future)
    await callBackendAPI(MOCK_BACKEND_CONFIG.endpoints.joinQueue, {
      userId,
      timestamp: Date.now(),
    });

    // Check if user is already allowed
    if (mockAllowedUsers.has(userId)) {
      return NextResponse.json({
        status: "allowed",
        message: "You are already authorized to proceed",
      } as QueueResponse);
    }

    // Check if user is already in queue
    const userInQueue = mockQueue.find((item) => item.userId === userId);

    if (userInQueue) {
      const userPosition =
        mockQueue.findIndex((item) => item.userId === userId) + 1;
      const estimatedWaitTime = Math.max(1, Math.floor(userPosition / 5)) * 2;

      return NextResponse.json({
        status: "waiting",
        position: userPosition,
        totalInQueue: mockQueue.length,
        estimatedWaitMinutes: estimatedWaitTime,
        message: `You are already in queue. Position ${userPosition} of ${mockQueue.length}`,
      } as QueueResponse);
    }

    // Check if queue is full
    if (mockQueue.length >= MAX_QUEUE_SIZE) {
      return NextResponse.json({
        status: "waiting",
        message: "Queue is full. Please try again later",
        totalInQueue: mockQueue.length,
      } as QueueResponse);
    }

    // Add user to queue
    mockQueue.push({
      userId,
      joinedAt: Date.now(),
    });

    const userPosition = mockQueue.length;
    const estimatedWaitTime = Math.max(1, Math.floor(userPosition / 5)) * 2;

    // For demo purposes: if user is position 1-3, allow them immediately
    if (userPosition <= 3) {
      // Remove user from queue and add to allowed users
      const userIndex = mockQueue.findIndex((item) => item.userId === userId);
      if (userIndex !== -1) {
        mockQueue.splice(userIndex, 1);
        mockAllowedUsers.add(userId);
      }

      return NextResponse.json({
        status: "allowed",
        message: "You have been granted access to make a reservation",
      } as QueueResponse);
    }

    return NextResponse.json({
      status: "waiting",
      position: userPosition,
      totalInQueue: mockQueue.length,
      estimatedWaitMinutes: estimatedWaitTime,
      message: `You joined the queue. Position ${userPosition} of ${mockQueue.length}`,
    } as QueueResponse);
  } catch (error) {
    console.error("Queue API error:", error);
    return NextResponse.json(
      {
        status: "waiting",
        message: "Queue service error. Please try again",
      } as QueueResponse,
      { status: 500 }
    );
  }
}

// GET: Check queue status
export async function GET(request: NextRequest) {
  try {
    const userId = generateUserId(request);

    // Check rate limit (more lenient than POST)
    const { allowed } = checkRateLimit(`get_${userId}`);

    if (!allowed) {
      return NextResponse.json(
        {
          status: "rate_limited",
          message: "Too many status checks. Please wait a moment",
        } as QueueResponse,
        { status: 429 }
      );
    }

    // Call Mock Backend API to check status
    await callBackendAPI(MOCK_BACKEND_CONFIG.endpoints.checkStatus, {
      userId,
    });

    // Check if user is allowed
    if (mockAllowedUsers.has(userId)) {
      return NextResponse.json({
        status: "allowed",
        message: "You are authorized to proceed",
      } as QueueResponse);
    }

    // Check if user is in queue
    const userInQueue = mockQueue.find((item) => item.userId === userId);

    if (userInQueue) {
      const userPosition =
        mockQueue.findIndex((item) => item.userId === userId) + 1;
      const estimatedWaitTime = Math.max(1, Math.floor(userPosition / 5)) * 2;

      // For demo purposes: if user is position 1-3, allow them immediately
      if (userPosition <= 3) {
        // Remove user from queue and add to allowed users
        const userIndex = mockQueue.findIndex((item) => item.userId === userId);
        if (userIndex !== -1) {
          mockQueue.splice(userIndex, 1);
          mockAllowedUsers.add(userId);
        }

        return NextResponse.json({
          status: "allowed",
          message: "You have been granted access to make a reservation",
        } as QueueResponse);
      }

      return NextResponse.json({
        status: "waiting",
        position: userPosition,
        totalInQueue: mockQueue.length,
        estimatedWaitMinutes: estimatedWaitTime,
        message: `You are in queue. Position ${userPosition} of ${mockQueue.length}`,
      } as QueueResponse);
    }

    // User is not in queue
    return NextResponse.json({
      status: "waiting",
      totalInQueue: mockQueue.length,
      message: `Current queue has ${mockQueue.length} people. You need to join the queue first`,
    } as QueueResponse);
  } catch (error) {
    console.error("Queue status check error:", error);
    return NextResponse.json(
      {
        status: "waiting",
        message: "Unable to check queue status. Please try again",
      } as QueueResponse,
      { status: 500 }
    );
  }
}
