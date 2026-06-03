import type { RateLimitConfig, RateLimitEntry } from "../types.js";

/**
 * Simple in-memory rate limiter for API routes.
 * In production, replace with Redis-based implementation.
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      windowMs: config?.windowMs ?? 60_000, // 1 minute window
      maxRequests: config?.maxRequests ?? 60, // 60 requests per minute
    };
  }

  /**
   * Check if a request should be rate limited.
   * Returns number of remaining requests in the window.
   */
  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    this.purgeExpired();
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // Start new window
      const resetAt = now + this.config.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.config.maxRequests - 1, resetAt };
    }

    entry.count++;

    if (entry.count > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Middleware-style wrapper for rate limiting.
   */
  middleware(keyFn: (req: Request) => string) {
    return (req: Request): Response | null => {
      const key = keyFn(req);
      const result = this.check(key);

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }

      return null; // No rate limit error
    };
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  /** Reset limiter (for testing) */
  reset(): void {
    this.store.clear();
  }
}

/** Default instance for general API use */
export const defaultRateLimiter = new RateLimiter();

/** Stricter limiter for auth endpoints */
export const authRateLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 10, // 10 auth attempts per minute
});
