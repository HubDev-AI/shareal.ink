import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { IRateLimiter, RateLimitResult } from "@/lib/interfaces";

export class UpstashRateLimiter implements IRateLimiter {
  private defaultLimiter: Ratelimit;
  private respondLimiter: Ratelimit;

  constructor() {
    const redis = Redis.fromEnv();
    this.defaultLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "rl",
    });
    this.respondLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      prefix: "rl:respond",
    });
  }

  async check(key: string): Promise<RateLimitResult> {
    const limiter = key.startsWith("respond:") ? this.respondLimiter : this.defaultLimiter;
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }
}
