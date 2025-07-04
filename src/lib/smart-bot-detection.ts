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

    // Keep last 10 requests
    history.push(now);
    if (history.length > 10) {
      history.shift();
    }

    this.requestHistory.set(userId, history);
  }

  // Phase 3: Smart risk assessment algorithm
  private calculateRiskAssessment(
    metrics: BotDetectionMetrics
  ): RiskAssessment {
    const reasons: string[] = [];
    let riskScore = 0;
    let confidence = 0.8; // Base confidence

    // 1. Request frequency analysis
    if (metrics.requestFrequency > 10) {
      riskScore += 0.3;
      reasons.push("High request frequency");
    }

    // 2. Human interaction indicators
    if (!metrics.mouseMovement && !metrics.keyboardInput) {
      riskScore += 0.25;
      reasons.push("No human-like interactions detected");
    }

    // 3. Time on page analysis
    if (metrics.timeOnPage < 5) {
      riskScore += 0.2;
      reasons.push("Very short time on page");
    }

    // 4. User agent analysis
    if (this.isSuspiciousUserAgent(metrics.userAgent)) {
      riskScore += 0.15;
      reasons.push("Suspicious user agent");
    }

    // 5. Browser fingerprint analysis
    if (this.isSuspiciousFingerprint(metrics.browserFingerprint)) {
      riskScore += 0.1;
      reasons.push("Suspicious browser fingerprint");
    }

    // 6. Request pattern analysis
    const requestPatternScore = this.analyzeRequestPattern(
      metrics.requestPattern
    );
    riskScore += requestPatternScore;
    if (requestPatternScore > 0.1) {
      reasons.push("Automated request pattern detected");
    }

    // Normalize risk score
    riskScore = Math.min(riskScore, 1);

    // Determine recommendation
    let recommendation: "allow" | "captcha" | "block";
    if (riskScore < 0.3) {
      recommendation = "allow";
    } else if (riskScore < 0.7) {
      recommendation = "captcha";
    } else {
      recommendation = "block";
      confidence = 0.9; // High confidence for blocking
    }

    return {
      riskScore,
      recommendation,
      reasons,
      confidence,
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
      "webdriver",
      "automation",
    ];

    return suspiciousPatterns.some((pattern) =>
      userAgent.toLowerCase().includes(pattern)
    );
  }

  private isSuspiciousFingerprint(fingerprint: string): boolean {
    // Simple check for now - can be enhanced
    return fingerprint.length < 10 || fingerprint === "unknown";
  }

  private analyzeRequestPattern(pattern: number[]): number {
    if (pattern.length < 3) return 0;

    // Check for too regular intervals (bot-like)
    const intervals = [];
    for (let i = 1; i < pattern.length; i++) {
      intervals.push(pattern[i] - pattern[i - 1]);
    }

    // Calculate standard deviation of intervals
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    // If intervals are too regular (low std dev), it's suspicious
    return stdDev < 100 ? 0.2 : 0; // Less than 100ms variation is suspicious
  }

  // Public methods for integration
  getMetrics(userId: string): BotDetectionMetrics | null {
    return this.metrics.get(userId) || null;
  }

  shouldRequireCaptcha(userId: string): boolean {
    const assessment = this.collectMetrics(userId, {});
    return (
      assessment.recommendation === "captcha" ||
      assessment.recommendation === "block"
    );
  }

  // Client-side behavior tracking (to be called from browser)
  trackBehavior(
    userId: string,
    behavior: {
      mouseMovement?: boolean;
      keyboardInput?: boolean;
      clickSpeed?: number;
      scrollBehavior?: number;
      timeOnPage?: number;
    }
  ): void {
    this.collectMetrics(userId, behavior);
  }
}
