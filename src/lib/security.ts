import crypto from "crypto";

// Input validation utilities
export class InputValidator {
  static validateUserId(userId: string): boolean {
    if (!userId || typeof userId !== "string") {
      return false;
    }

    // Basic validation - no special characters that could be harmful
    const validUserIdPattern = /^[a-zA-Z0-9_-]+$/;
    return (
      validUserIdPattern.test(userId) &&
      userId.length >= 3 &&
      userId.length <= 50
    );
  }

  static validateBranchData(branchData: unknown): boolean {
    if (!branchData || typeof branchData !== "object") {
      return false;
    }

    const data = branchData as Record<string, unknown>;

    // Check required fields
    if (!data.branchId || typeof data.branchId !== "string") {
      return false;
    }

    if (!data.branchName || typeof data.branchName !== "string") {
      return false;
    }

    // Validate branch ID format
    const validBranchIdPattern = /^[A-Z0-9]{3,10}$/;
    return validBranchIdPattern.test(data.branchId as string);
  }

  static validateProductData(productData: unknown): boolean {
    if (!productData || typeof productData !== "object") {
      return false;
    }

    const data = productData as Record<string, unknown>;

    // Check required fields
    if (!data.productType || typeof data.productType !== "string") {
      return false;
    }

    if (!data.quantity || typeof data.quantity !== "number") {
      return false;
    }

    // Validate product type
    const validProductTypes = ["A4", "CONTINUOUS"];
    if (!validProductTypes.includes(data.productType as string)) {
      return false;
    }

    // Validate quantity
    if (data.quantity < 1 || data.quantity > 1000) {
      return false;
    }

    return true;
  }

  static sanitizeInput(input: string): string {
    if (!input || typeof input !== "string") {
      return "";
    }

    // Remove potentially harmful characters
    return input
      .replace(/[<>\"']/g, "") // Remove HTML/JS injection chars
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .substring(0, 255); // Limit length
  }
}

// CSRF Protection
export class CSRFProtection {
  private static readonly SECRET =
    process.env.CSRF_SECRET || "default-secret-change-in-production";
  private static readonly TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes

  static generateToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString("hex");
    const data = `${timestamp}:${randomBytes}`;

    const hmac = crypto.createHmac("sha256", this.SECRET);
    hmac.update(data);
    const signature = hmac.digest("hex");

    return `${data}:${signature}`;
  }

  static validateToken(token: string): boolean {
    try {
      const parts = token.split(":");
      if (parts.length !== 3) {
        return false;
      }

      const [timestamp, randomBytes, signature] = parts;
      const data = `${timestamp}:${randomBytes}`;

      // Verify signature
      const hmac = crypto.createHmac("sha256", this.SECRET);
      hmac.update(data);
      const expectedSignature = hmac.digest("hex");

      if (signature !== expectedSignature) {
        return false;
      }

      // Check expiry
      const tokenTime = parseInt(timestamp);
      const now = Date.now();

      if (now - tokenTime > this.TOKEN_EXPIRY) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Rate limiting by IP with more sophisticated tracking
export class AdvancedRateLimiter {
  private static readonly MAX_REQUESTS_PER_MINUTE = 10;
  private static readonly MAX_REQUESTS_PER_HOUR = 100;
  private static readonly BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  private static minuteWindows = new Map<string, number[]>();
  private static hourWindows = new Map<string, number[]>();
  private static blockedIPs = new Map<string, number>();

  static checkRateLimit(ip: string): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  } {
    const now = Date.now();

    // Check if IP is blocked
    const blockExpiry = this.blockedIPs.get(ip);
    if (blockExpiry && now < blockExpiry) {
      return {
        allowed: false,
        reason: "IP temporarily blocked",
        retryAfter: blockExpiry - now,
      };
    }

    // Clean up expired blocks
    if (blockExpiry && now >= blockExpiry) {
      this.blockedIPs.delete(ip);
    }

    // Check minute window
    const minuteRequests = this.minuteWindows.get(ip) || [];
    const recentMinuteRequests = minuteRequests.filter(
      (time) => now - time < 60 * 1000
    );

    if (recentMinuteRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      // Block IP for repeated violations
      this.blockedIPs.set(ip, now + this.BLOCK_DURATION);
      return {
        allowed: false,
        reason: "Too many requests per minute",
        retryAfter: this.BLOCK_DURATION,
      };
    }

    // Check hour window
    const hourRequests = this.hourWindows.get(ip) || [];
    const recentHourRequests = hourRequests.filter(
      (time) => now - time < 60 * 60 * 1000
    );

    if (recentHourRequests.length >= this.MAX_REQUESTS_PER_HOUR) {
      return {
        allowed: false,
        reason: "Too many requests per hour",
        retryAfter: 60 * 60 * 1000 - (now - recentHourRequests[0]),
      };
    }

    // Update windows
    recentMinuteRequests.push(now);
    recentHourRequests.push(now);

    this.minuteWindows.set(ip, recentMinuteRequests);
    this.hourWindows.set(ip, recentHourRequests);

    return { allowed: true };
  }

  static getStats(ip: string): {
    minuteCount: number;
    hourCount: number;
    isBlocked: boolean;
  } {
    const now = Date.now();
    const minuteRequests = this.minuteWindows.get(ip) || [];
    const hourRequests = this.hourWindows.get(ip) || [];
    const blockExpiry = this.blockedIPs.get(ip);

    return {
      minuteCount: minuteRequests.filter((time) => now - time < 60 * 1000)
        .length,
      hourCount: hourRequests.filter((time) => now - time < 60 * 60 * 1000)
        .length,
      isBlocked: blockExpiry ? now < blockExpiry : false,
    };
  }
}
