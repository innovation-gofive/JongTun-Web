// CAPTCHA Utility Functions
// Phase 3: Smart conditional CAPTCHA with bot detection

import { BotDetectionService, RiskAssessment } from "./bot-detection";

export interface CaptchaConfig {
  enabled: boolean;
  siteKey: string;
  threshold: number;
  version: "v2" | "v3";
  adaptiveMode: boolean; // Phase 3: Smart mode
}

export interface CaptchaVerificationResult {
  success: boolean;
  score?: number;
  error?: string;
  action?: string;
  hostname?: string;
  botAssessment?: RiskAssessment; // Bot detection result
}

// Get CAPTCHA configuration from environment
export function getCaptchaConfig(): CaptchaConfig {
  return {
    enabled: process.env.ENABLE_CAPTCHA === "true",
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
    threshold: parseFloat(process.env.CAPTCHA_THRESHOLD || "0.5"),
    version: "v3",
    adaptiveMode: true, // Phase 3: Enable smart mode
  };
}

// Phase 3: Smart CAPTCHA decision with bot detection
export function shouldShowCaptcha(userId?: string): boolean {
  const config = getCaptchaConfig();

  // Phase 3: Always disabled if CAPTCHA not enabled
  if (!config.enabled) {
    return false;
  }

  // Phase 3: Use smart bot detection if adaptive mode enabled
  if (config.adaptiveMode && userId) {
    const botDetection = BotDetectionService.getInstance();
    return botDetection.shouldShowCaptcha(userId);
  }

  // Fallback: Show CAPTCHA only if explicitly enabled
  return config.enabled;
}

// Client-side: Execute reCAPTCHA v3
export async function executeCaptcha(
  action: string = "join_queue"
): Promise<string | null> {
  try {
    const config = getCaptchaConfig();

    if (!config.enabled || !config.siteKey) {
      return null;
    }

    // Check if reCAPTCHA is loaded
    if (typeof window === "undefined" || !window.grecaptcha) {
      console.warn("reCAPTCHA not loaded");
      return null;
    }

    // Execute reCAPTCHA v3
    const token = await window.grecaptcha.execute(config.siteKey, { action });
    return token;
  } catch (error) {
    console.error("CAPTCHA execution error:", error);
    return null;
  }
}

// Server-side: Verify CAPTCHA token
export async function verifyCaptchaToken(
  token: string,
  userIP?: string
): Promise<CaptchaVerificationResult> {
  try {
    const config = getCaptchaConfig();

    if (!config.enabled) {
      return { success: true }; // Skip verification if disabled
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      throw new Error("CAPTCHA secret key not configured");
    }

    // Verify token with Google
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: userIP || "",
        }),
      }
    );

    const data = await response.json();

    // Check success and score for v3
    const result: CaptchaVerificationResult = {
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
    };

    // For v3, check score threshold
    if (data.success && data.score !== undefined) {
      result.success = data.score >= config.threshold;
      if (!result.success) {
        result.error = `Score ${data.score} below threshold ${config.threshold}`;
      }
    }

    return result;
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

// Add types for window.grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}
