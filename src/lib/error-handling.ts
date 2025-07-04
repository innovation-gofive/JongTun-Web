// Enhanced error handling utilities & security/monitoring helpers

// --- Type Definitions ---
type ValidationRule<T = unknown> = (value: T) => boolean;
type ValidationRules = Record<string, ValidationRule>;
type LogMetadata = Record<string, unknown>;

// --- Input Validation ---
export function validateInput(
  fields: Record<string, unknown>,
  rules: ValidationRules
): void {
  for (const key in rules) {
    if (!rules[key](fields[key])) {
      throw new InvalidInputError(key);
    }
  }
}

// --- CSRF Protection (Mock, for real API use a proper library) ---
export function mockVerifyCSRF(token: string | undefined): void {
  // In real API, use a secure CSRF library. Here, just check presence for mock.
  if (!token || typeof token !== "string" || token.length < 8) {
    throw new QueueError("Invalid or missing CSRF token", "CSRF_INVALID", 403);
  }
}

// --- Monitoring & Logging ---
export function logEvent(event: string, meta?: LogMetadata): void {
  // In real API, send to external logging/monitoring system
  if (meta) {
    console.log(`[LOG] ${event}`, meta);
  } else {
    console.log(`[LOG] ${event}`);
  }
}

export class QueueError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "QueueError";
  }
}

export class RateLimitError extends QueueError {
  constructor(resetTime: number) {
    super(
      `Rate limit exceeded. Try again after ${new Date(
        resetTime
      ).toISOString()}`,
      "RATE_LIMIT_EXCEEDED",
      429
    );
  }
}

export class QueueFullError extends QueueError {
  constructor() {
    super("Queue is full. Please try again later.", "QUEUE_FULL", 503);
  }
}

export class InvalidInputError extends QueueError {
  constructor(field: string) {
    super(`Invalid input: ${field}`, "INVALID_INPUT", 400);
  }
}

// Retry mechanism with exponential backoff
export class RetryManager {
  private static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await this.delay(delay);
      }
    }

    throw lastError!;
  }
}

// Circuit breaker pattern for API calls
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private maxFailures: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new QueueError(
          "Circuit breaker is open",
          "CIRCUIT_BREAKER_OPEN",
          503
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.maxFailures) {
      this.state = "OPEN";
    }
  }

  getState(): string {
    return this.state;
  }
}

// Fallback queue system (in-memory when external fails)
export class FallbackQueueManager {
  private static instance: FallbackQueueManager;
  private fallbackQueue: Array<{ userId: string; joinedAt: number }> = [];
  private isUsingFallback: boolean = false;

  static getInstance(): FallbackQueueManager {
    if (!this.instance) {
      this.instance = new FallbackQueueManager();
    }
    return this.instance;
  }

  enableFallback(): void {
    this.isUsingFallback = true;
    console.warn("[FALLBACK] Switching to in-memory queue");
  }

  disableFallback(): void {
    this.isUsingFallback = false;
    console.log("[FALLBACK] Switching back to primary queue");
  }

  isInFallbackMode(): boolean {
    return this.isUsingFallback;
  }

  addToFallbackQueue(userId: string): void {
    this.fallbackQueue.push({ userId, joinedAt: Date.now() });
  }

  getFallbackQueuePosition(userId: string): number | null {
    const index = this.fallbackQueue.findIndex(
      (item) => item.userId === userId
    );
    return index >= 0 ? index + 1 : null;
  }

  getFallbackQueueSize(): number {
    return this.fallbackQueue.length;
  }

  processFallbackQueue(): void {
    // Process items from fallback queue
    while (this.fallbackQueue.length > 0) {
      const item = this.fallbackQueue.shift();
      console.log(`[FALLBACK] Processing queued item: ${item?.userId}`);
      // Here you would normally send to the main queue
    }
  }
}
