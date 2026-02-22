import type { IRateLimiter, RateLimitResult } from "@/lib/interfaces";

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export class InMemoryRateLimiter implements IRateLimiter {
  private store = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;

  constructor(config?: RateLimiterConfig) {
    this.maxRequests = config?.maxRequests ?? parseInt(process.env.RATE_LIMIT_MAX ?? "20", 10);
    this.windowMs = config?.windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);

    // Periodic cleanup to prevent memory leak
    const interval = setInterval(() => this.cleanup(), this.windowMs * 2);
    if (interval.unref) interval.unref();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.store) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, valid);
      }
    }
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const timestamps = (this.store.get(key) ?? []).filter((t) => now - t < this.windowMs);

    if (timestamps.length >= this.maxRequests) {
      const resetAt = timestamps[0] + this.windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    timestamps.push(now);
    this.store.set(key, timestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - timestamps.length,
      resetAt: now + this.windowMs,
    };
  }
}
