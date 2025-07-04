import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logEvent } from "./src/lib/error-handling";

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // max 100 requests per window
  apiMaxRequests: 20, // max 20 API requests per window
};

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function checkRateLimit(
  ip: string,
  path: string,
  isApiRoute: boolean
): { allowed: boolean; resetTime?: number } {
  const key = getRateLimitKey(ip, path);
  const now = Date.now();
  const maxRequests = isApiRoute
    ? RATE_LIMIT_CONFIG.apiMaxRequests
    : RATE_LIMIT_CONFIG.maxRequests;

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return { allowed: true };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, resetTime: existing.resetTime };
  }

  existing.count++;
  return { allowed: true };
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Log all requests
  logEvent("MIDDLEWARE_REQUEST", {
    method,
    path,
    ip,
    userAgent: userAgent.substring(0, 100),
    timestamp: new Date().toISOString(),
  });

  // Check if it's an API route
  const isApiRoute = path.startsWith("/api/");

  // Apply rate limiting
  const rateLimitResult = checkRateLimit(ip, path, isApiRoute);

  if (!rateLimitResult.allowed) {
    logEvent("MIDDLEWARE_RATE_LIMIT_EXCEEDED", {
      ip,
      path,
      method,
      resetTime: rateLimitResult.resetTime,
    });

    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many requests from this IP. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        resetTime: rateLimitResult.resetTime,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(
            (rateLimitResult.resetTime! - Date.now()) / 1000
          ).toString(),
          ...securityHeaders,
        },
      }
    );
  }

  // For API routes, add additional security checks
  if (isApiRoute && method === "POST") {
    const csrfToken = request.headers.get("X-CSRF-Token");

    // Simple CSRF check for mock (in production, use proper CSRF library)
    if (!csrfToken || csrfToken.length < 8) {
      logEvent("MIDDLEWARE_CSRF_VALIDATION_FAILED", {
        ip,
        path,
        method,
        hasToken: !!csrfToken,
        tokenLength: csrfToken?.length || 0,
      });

      return new NextResponse(
        JSON.stringify({
          error: "CSRF token validation failed",
          message: "Invalid or missing CSRF token",
          code: "CSRF_INVALID",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            ...securityHeaders,
          },
        }
      );
    }
  }

  // Continue with the request
  const response = NextResponse.next();

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Log response
  const duration = Date.now() - startTime;
  logEvent("MIDDLEWARE_RESPONSE", {
    method,
    path,
    duration,
    ip,
    status: response.status,
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
