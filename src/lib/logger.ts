// Enhanced logging system with metrics and structured logging
interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

interface QueueMetrics {
  totalRequests: number;
  successfulJoins: number;
  failedJoins: number;
  rateLimitHits: number;
  averageQueueSize: number;
  peakQueueSize: number;
  averageWaitTime: number;
  errors: Map<string, number>;
}

class EnhancedLogger {
  private metrics: QueueMetrics = {
    totalRequests: 0,
    successfulJoins: 0,
    failedJoins: 0,
    rateLimitHits: 0,
    averageQueueSize: 0,
    peakQueueSize: 0,
    averageWaitTime: 0,
    errors: new Map(),
  };

  private queueSizeSamples: number[] = [];
  private waitTimeSamples: number[] = [];

  private formatLogEntry(entry: LogEntry): string {
    const contextStr = entry.context ? JSON.stringify(entry.context) : "";
    const userInfo = entry.userId ? `[User: ${entry.userId}]` : "";
    const ipInfo = entry.ip ? `[IP: ${entry.ip}]` : "";

    return `[${entry.timestamp}] [${entry.level}] ${userInfo}${ipInfo} ${entry.message} ${contextStr}`;
  }

  log(
    message: string,
    context?: Record<string, unknown>,
    userId?: string,
    ip?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      message,
      context,
      userId,
      ip,
    };

    if (process.env.NODE_ENV === "development") {
      console.log(this.formatLogEntry(entry));
    }

    // In production, you would send this to a logging service
    // like CloudWatch, Datadog, or Elasticsearch
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
    userId?: string,
    ip?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      context: {
        ...context,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      },
      userId,
      ip,
    };

    if (process.env.NODE_ENV === "development") {
      console.error(this.formatLogEntry(entry));
    }

    // Track error metrics
    const errorType = error?.name || "UnknownError";
    this.metrics.errors.set(
      errorType,
      (this.metrics.errors.get(errorType) || 0) + 1
    );
  }

  warn(
    message: string,
    context?: Record<string, unknown>,
    userId?: string,
    ip?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      message,
      context,
      userId,
      ip,
    };

    if (process.env.NODE_ENV === "development") {
      console.warn(this.formatLogEntry(entry));
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "development") return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "DEBUG",
      message,
      context,
    };

    console.debug(this.formatLogEntry(entry));
  }

  // Metrics tracking methods
  incrementTotalRequests(): void {
    this.metrics.totalRequests++;
  }

  incrementSuccessfulJoins(): void {
    this.metrics.successfulJoins++;
  }

  incrementFailedJoins(): void {
    this.metrics.failedJoins++;
  }

  incrementRateLimitHits(): void {
    this.metrics.rateLimitHits++;
  }

  recordQueueSize(size: number): void {
    this.queueSizeSamples.push(size);
    if (size > this.metrics.peakQueueSize) {
      this.metrics.peakQueueSize = size;
    }

    // Keep only last 100 samples
    if (this.queueSizeSamples.length > 100) {
      this.queueSizeSamples.shift();
    }

    // Calculate average
    this.metrics.averageQueueSize =
      this.queueSizeSamples.reduce((a, b) => a + b, 0) /
      this.queueSizeSamples.length;
  }

  recordWaitTime(waitTimeMs: number): void {
    this.waitTimeSamples.push(waitTimeMs);

    // Keep only last 100 samples
    if (this.waitTimeSamples.length > 100) {
      this.waitTimeSamples.shift();
    }

    // Calculate average
    this.metrics.averageWaitTime =
      this.waitTimeSamples.reduce((a, b) => a + b, 0) /
      this.waitTimeSamples.length;
  }

  getMetrics(): QueueMetrics & {
    successRate: number;
    errorRate: number;
    topErrors: Array<{ error: string; count: number }>;
  } {
    const successRate =
      this.metrics.totalRequests > 0
        ? (this.metrics.successfulJoins / this.metrics.totalRequests) * 100
        : 0;

    const errorRate =
      this.metrics.totalRequests > 0
        ? (this.metrics.failedJoins / this.metrics.totalRequests) * 100
        : 0;

    const topErrors = Array.from(this.metrics.errors.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      ...this.metrics,
      successRate,
      errorRate,
      topErrors,
    };
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulJoins: 0,
      failedJoins: 0,
      rateLimitHits: 0,
      averageQueueSize: 0,
      peakQueueSize: 0,
      averageWaitTime: 0,
      errors: new Map(),
    };
    this.queueSizeSamples = [];
    this.waitTimeSamples = [];
  }

  // Performance monitoring
  async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string,
    userId?: string
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.log(
        `Operation completed: ${operationName}`,
        {
          duration: `${duration}ms`,
          success: true,
        },
        userId
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.error(
        `Operation failed: ${operationName}`,
        error as Error,
        {
          duration: `${duration}ms`,
          success: false,
        },
        userId
      );

      throw error;
    }
  }
}

// Export singleton instance
export const logger = new EnhancedLogger();

// Legacy export for backward compatibility
export const simpleLogger = {
  log: (message: string, ...args: unknown[]) => {
    logger.log(message, { args });
  },
  error: (message: string, ...args: unknown[]) => {
    logger.error(message, undefined, { args });
  },
  warn: (message: string, ...args: unknown[]) => {
    logger.warn(message, { args });
  },
};
