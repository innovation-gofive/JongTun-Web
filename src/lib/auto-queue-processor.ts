// Auto-Queue Processing (แทนที่ Manual Admin)
// สำหรับระบบ Self-Service ที่ไม่ต้องมีคนคอย

import {
  processQueue,
  getQueueStats,
  mockQueue,
  mockAllowedUsers,
} from "./queue-utils";
import { logEvent } from "./error-handling";

export interface AutoQueueConfig {
  enabled: boolean;
  processingInterval: number; // มิลลิวินาที (เช่น 30000 = 30วินาที)
  batchSize: number; // จำนวนคนที่ปล่อยในแต่ละครั้ง
  maxConcurrentUsers: number; // จำนวนคนสูงสุดที่อนุญาตพร้อมกัน
  businessHours: {
    enabled: boolean;
    start: string; // "09:00"
    end: string; // "17:00"
    timezone: string; // "Asia/Bangkok"
  };
}

class AutoQueueProcessor {
  private static instance: AutoQueueProcessor;
  private config: AutoQueueConfig;
  private processingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      enabled: true,
      processingInterval: 30000, // ปล่อยทุก 30 วินาที
      batchSize: 5, // ปล่อยคิวละ 5 คน
      maxConcurrentUsers: 20, // อนุญาตให้มีคนได้สูงสุด 20 คนพร้อมกัน
      businessHours: {
        enabled: false, // ปิดการจำกัดเวลา = เปิด 24/7
        start: "09:00",
        end: "17:00",
        timezone: "Asia/Bangkok",
      },
    };
  }

  static getInstance(): AutoQueueProcessor {
    if (!AutoQueueProcessor.instance) {
      AutoQueueProcessor.instance = new AutoQueueProcessor();
    }
    return AutoQueueProcessor.instance;
  }

  start(): void {
    if (!this.config.enabled) return;

    this.processingTimer = setInterval(() => {
      this.processQueueAutomatically();
    }, this.config.processingInterval);

    console.log(
      `Auto-queue processing started. Interval: ${this.config.processingInterval}ms, Batch: ${this.config.batchSize}`
    );
  }

  stop(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
      console.log("Auto-queue processing stopped");
    }
  }

  private processQueueAutomatically(): void {
    try {
      // ตรวจสอบ business hours
      if (!this.isWithinBusinessHours()) {
        return; // ไม่ปล่อยคิวนอกเวลาทำการ
      }

      // ตรวจสอบจำนวนคนที่อนุญาตพร้อมกัน
      const currentAllowed = mockAllowedUsers.size;
      if (currentAllowed >= this.config.maxConcurrentUsers) {
        console.log(
          `Max concurrent users reached: ${currentAllowed}/${this.config.maxConcurrentUsers}`
        );
        return;
      }

      // คำนวณจำนวนที่จะปล่อย
      const availableSlots = this.config.maxConcurrentUsers - currentAllowed;
      const batchSize = Math.min(this.config.batchSize, availableSlots);

      if (mockQueue.length === 0) {
        return; // ไม่มีคิว
      }

      // ปล่อยคิว
      const result = processQueue(batchSize);

      if (result.processedCount > 0) {
        console.log(
          `Auto-processed ${result.processedCount} users. Remaining: ${result.remainingInQueue}`
        );

        // Log สำหรับ monitoring
        logEvent("AUTO_QUEUE_PROCESSED", {
          processedCount: result.processedCount,
          remainingInQueue: result.remainingInQueue,
          currentAllowed: mockAllowedUsers.size,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Auto-queue processing error:", error);
      logEvent("AUTO_QUEUE_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  private isWithinBusinessHours(): boolean {
    if (!this.config.businessHours.enabled) {
      return true; // 24/7 operation
    }

    const now = new Date();
    const currentTime = now
      .toLocaleTimeString("en-GB", {
        timeZone: this.config.businessHours.timezone,
        hour12: false,
      })
      .substring(0, 5); // "HH:MM"

    return (
      currentTime >= this.config.businessHours.start &&
      currentTime <= this.config.businessHours.end
    );
  }

  // Methods for runtime configuration
  updateConfig(newConfig: Partial<AutoQueueConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart with new configuration
    this.stop();
    if (this.config.enabled) {
      this.start();
    }
  }

  getConfig(): AutoQueueConfig {
    return { ...this.config };
  }

  getStatus() {
    return {
      isRunning: this.processingTimer !== null,
      config: this.config,
      currentStats: getQueueStats(),
      isWithinBusinessHours: this.isWithinBusinessHours(),
    };
  }
}

// Export singleton instance
export const autoQueueProcessor = AutoQueueProcessor.getInstance();

// Auto-start when server starts (สำหรับ production)
if (process.env.NODE_ENV === "production") {
  autoQueueProcessor.start();
}

// Development: Start manually or via API
if (process.env.NODE_ENV === "development") {
  console.log(
    "Auto-queue processor ready. Call autoQueueProcessor.start() to begin."
  );
}
