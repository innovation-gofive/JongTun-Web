import { NextRequest, NextResponse } from "next/server";
import { processQueue, getQueueStats } from "@/app/api/queue/status/route";

// Mock Admin API for queue management
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case "process":
        // Process queue - allow first 5 users to proceed
        const processResult = processQueue(5);
        return NextResponse.json({
          ...processResult,
          message: `Queue processed successfully. ${processResult.processedCount} users allowed to proceed`,
        });

      case "stats":
        // Queue statistics
        const stats = getQueueStats();
        return NextResponse.json({
          ...stats,
          message: "Current queue statistics",
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: process or stats" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Queue admin error:", error);
    return NextResponse.json(
      { error: "Failed to perform queue operation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = getQueueStats();
    return NextResponse.json({
      message: "Queue Admin API - Mock Queue Management System",
      stats,
      availableActions: ["process", "stats"],
      note: "Use POST request with action to manage queue",
    });
  } catch (error) {
    console.error("Queue admin error:", error);
    return NextResponse.json(
      { error: "Failed to get queue information" },
      { status: 500 }
    );
  }
}
