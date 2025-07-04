// Phase 3 Implementation: Smart Bot Detection & Risk Assessment
// Now actively used for CAPTCHA decisions

import { logger } from "./logger";

export interface BotDetectionMetrics {
  requestFrequency: number;
  mouseMovement: boolean;
  keyboardInput: boolean;
  timeOnPage: number;
  userAgent: string;
  suspiciousPatterns: string[];
  // Phase 3: New metrics
  clickSpeed: number;
  scrollBehavior: number;
  requestPattern: number[];
  browserFingerprint: string;
}

export interface RiskAssessment {
  riskScore: number; // 0-1 (1 = highest risk)
  recommendation: "allow" | "captcha" | "block";
  reasons: string[];
  confidence: number; // 0-1
}

export class BotDetectionService {
  private static instance: BotDetectionService;
  private metrics: Map<string, BotDetectionMetrics> = new Map();
  private requestHistory: Map<string, number[]> = new Map();

  static getInstance(): BotDetectionService {
    if (!BotDetectionService.instance) {
      BotDetectionService.instance = new BotDetectionService();
    }
    return BotDetectionService.instance;
  }

  // Phase 3: Active metric collection with risk assessment
  collectMetrics(
    userId: string,
    metric: Partial<BotDetectionMetrics>
  ): RiskAssessment {
    try {
      const existing = this.metrics.get(userId) || {
        requestFrequency: 0,
        mouseMovement: false,
        keyboardInput: false,
        timeOnPage: 0,
        userAgent: "",
        suspiciousPatterns: [],
        clickSpeed: 0,
        scrollBehavior: 0,
        requestPattern: [],
        browserFingerprint: "",
      };

      const updated = { ...existing, ...metric };
      this.metrics.set(userId, updated);

      // Track request timing
      this.trackRequestTiming(userId);

      const riskAssessment = this.calculateRiskAssessment(updated);

      // Log for monitoring
      logger.log("BOT_DETECTION_ASSESSMENT", {
        userId,
        metric: updated,
        riskAssessment,
        timestamp: new Date().toISOString(),
      });

      return riskAssessment;
    } catch (error) {
      // Safe fallback - allow user to proceed
      logger.error("BotDetectionService.collectMetrics", error as Error);
      return {
        riskScore: 0,
        recommendation: "allow",
        reasons: ["Error in bot detection - failing safe"],
        confidence: 0,
      };
    }
  }

  // Track request timing patterns
  private trackRequestTiming(userId: string): void {
    const now = Date.now();
    const history = this.requestHistory.get(userId) || [];

    // Keep only last 10 requests
    history.push(now);
    if (history.length > 10) {
      history.shift();
    }

    this.requestHistory.set(userId, history);
  }

  // Phase 3: Calculate comprehensive risk assessment
  private calculateRiskAssessment(
    metrics: BotDetectionMetrics
  ): RiskAssessment {
    let riskScore = 0;
    const reasons: string[] = [];

    // High request frequency (0-0.3)
    if (metrics.requestFrequency > 10) {
      riskScore += 0.3;
      reasons.push("High request frequency");
    }

    // No human-like interactions (0-0.25)
    if (!metrics.mouseMovement && !metrics.keyboardInput) {
      riskScore += 0.25;
      reasons.push("No human interactions detected");
    }

    // Very short time on page (0-0.2)
    if (metrics.timeOnPage < 5) {
      riskScore += 0.2;
      reasons.push("Very short time on page");
    }

    // Suspicious user agent (0-0.15)
    if (this.isSuspiciousUserAgent(metrics.userAgent)) {
      riskScore += 0.15;
      reasons.push("Suspicious user agent");
    }

    // Click speed (too fast) (0-0.1)
    if (metrics.clickSpeed > 100) {
      // clicks per minute
      riskScore += 0.1;
      reasons.push("Abnormally fast clicking");
    }

    // Cap at 1.0
    riskScore = Math.min(riskScore, 1.0);

    // Determine recommendation
    let recommendation: "allow" | "captcha" | "block";
    if (riskScore >= 0.8) {
      recommendation = "block";
    } else if (riskScore >= 0.4) {
      recommendation = "captcha";
    } else {
      recommendation = "allow";
    }

    return {
      riskScore,
      recommendation,
      reasons,
      confidence: Math.min(0.9, riskScore + 0.3), // Higher risk = higher confidence
    };
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      "bot",
      "crawler",
      "spider",
      "scraper",
      "phantom",
      "headless",
      "selenium",
    ];

    return suspiciousPatterns.some((pattern) =>
      userAgent.toLowerCase().includes(pattern)
    );
  }

  // Get metrics for analysis
  getMetrics(userId: string): BotDetectionMetrics | null {
    return this.metrics.get(userId) || null;
  }

  // Phase 3: Smart CAPTCHA decision based on risk assessment
  shouldShowCaptcha(userId: string): boolean {
    try {
      const metrics = this.getMetrics(userId);
      if (!metrics) {
        // No metrics available - default to low risk
        return false;
      }

      const assessment = this.calculateRiskAssessment(metrics);

      // Log decision for monitoring
      logger.log("SMART_CAPTCHA_DECISION", {
        userId,
        riskAssessment: assessment,
        decision: assessment.recommendation === "captcha",
        timestamp: new Date().toISOString(),
      });

      return assessment.recommendation === "captcha";
    } catch (error) {
      // Safe fallback - don't show CAPTCHA on error
      logger.error("BotDetectionService.shouldShowCaptcha", error as Error);
      return false;
    }
  }

  // Get risk assessment for a user
  getRiskAssessment(userId: string): RiskAssessment | null {
    try {
      const metrics = this.getMetrics(userId);
      if (!metrics) return null;

      return this.calculateRiskAssessment(metrics);
    } catch (error) {
      logger.error("BotDetectionService.getRiskAssessment", error as Error);
      return null;
    }
  }

  // Clear metrics for a user (cleanup)
  clearMetrics(userId: string): void {
    this.metrics.delete(userId);
    this.requestHistory.delete(userId);
  }
}
