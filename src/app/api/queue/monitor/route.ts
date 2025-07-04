import { NextResponse } from "next/server";
import { getQueueStats } from "@/lib/queue-utils";
import { autoQueueProcessor } from "@/lib/auto-queue-processor";
import { logEvent } from "@/lib/error-handling";

// Queue Monitoring API (แทนที่ Admin Panel)
// READ-ONLY endpoint สำหรับดูสถิติและสถานะระบบ
export async function GET() {
  try {
    logEvent("QUEUE_MONITORING_REQUEST", {
      method: "GET",
      timestamp: new Date().toISOString(),
    });

    const stats = getQueueStats();
    const processorStatus = autoQueueProcessor.getStatus();

    // คำนวณเวลารอโดยประมาณ
    const estimatedWaitMinutes = Math.max(
      1,
      Math.ceil(stats.totalInQueue / processorStatus.config.batchSize)
    );

    return NextResponse.json({
      success: true,
      message: "Queue Monitoring - Self-Service Mode Active",
      timestamp: new Date().toISOString(),

      // สถิติคิวปัจจุบัน
      queue: {
        totalInQueue: stats.totalInQueue,
        allowedUsers: stats.allowedUsers,
        oldestInQueue: stats.oldestInQueue,
        estimatedWaitMinutes,

        // ข้อมูลเพิ่มเติม
        nextProcessingIn: processorStatus.config.processingInterval / 1000, // วินาที
        usersPerBatch: processorStatus.config.batchSize,
        maxConcurrentUsers: processorStatus.config.maxConcurrentUsers,
      },

      // สถานะระบบ Auto-Processing
      autoProcessor: {
        isRunning: processorStatus.isRunning,
        isEnabled: processorStatus.config.enabled,
        mode: "self-service",

        // กำหนดค่าการประมวลผล
        processing: {
          intervalSeconds: processorStatus.config.processingInterval / 1000,
          batchSize: processorStatus.config.batchSize,
          maxConcurrentUsers: processorStatus.config.maxConcurrentUsers,
        },

        // เวลาทำการ
        businessHours: {
          enabled: processorStatus.config.businessHours.enabled,
          isWithinHours: processorStatus.isWithinBusinessHours,
          start: processorStatus.config.businessHours.start,
          end: processorStatus.config.businessHours.end,
          timezone: processorStatus.config.businessHours.timezone,
        },
      },

      // สุขภาพระบบ
      systemHealth: {
        status: "healthy",
        mode: "self-service",
        adminRequired: false,
        lastUpdate: new Date().toISOString(),

        // ข้อมูลเพิ่มเติม
        features: {
          autoProcessing: true,
          manualIntervention: false,
          alwaysOnOperation: !processorStatus.config.businessHours.enabled,
        },
      },

      // ข้อมูลสำหรับ Dashboard
      dashboard: {
        currentUtilization: `${stats.allowedUsers}/${processorStatus.config.maxConcurrentUsers}`,
        queueEfficiency: stats.totalInQueue > 0 ? "processing" : "idle",
        averageWaitTime: `${estimatedWaitMinutes} minutes`,
        systemLoad:
          stats.totalInQueue > 20
            ? "high"
            : stats.totalInQueue > 10
            ? "medium"
            : "low",
      },
    });
  } catch (error) {
    logEvent("QUEUE_MONITORING_ERROR", {
      method: "GET",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get monitoring data",
        timestamp: new Date().toISOString(),
        systemHealth: {
          status: "error",
          mode: "self-service",
        },
      },
      { status: 500 }
    );
  }
}
