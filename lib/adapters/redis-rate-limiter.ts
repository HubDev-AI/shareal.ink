import Redis from "ioredis";
import type { IRateLimiter, RateLimitResult } from "@/lib/interfaces";

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowStart = tonumber(ARGV[2])
local maxRequests = tonumber(ARGV[3])
local windowSec = tonumber(ARGV[4])

redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
local count = redis.call('ZCARD', key)

if count >= maxRequests then
  return {0, 0, -1}
end

redis.call('ZADD', key, now, now .. ':' .. math.random())
redis.call('EXPIRE', key, windowSec)

return {1, maxRequests - count - 1, -1}
`;

export class RedisRateLimiter implements IRateLimiter {
  private redis: Redis;
  private defaultMax: number;
  private respondMax: number;
  private windowMs: number;

  constructor(url: string, defaultMax = 10, respondMax = 30, windowMs = 60_000) {
    this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    this.defaultMax = defaultMax;
    this.respondMax = respondMax;
    this.windowMs = windowMs;
  }

  async check(key: string): Promise<RateLimitResult> {
    const isRespond = key.startsWith("respond:");
    const max = isRespond ? this.respondMax : this.defaultMax;
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const windowSec = Math.ceil(this.windowMs / 1000);
    const redisKey = `rl:${key}`;

    try {
      const result = (await this.redis.eval(
        SLIDING_WINDOW_SCRIPT,
        1,
        redisKey,
        now,
        windowStart,
        max,
        windowSec,
      )) as number[];

      return {
        allowed: result[0] === 1,
        remaining: Math.max(0, result[1]),
        resetAt: now + this.windowMs,
      };
    } catch {
      // Redis down — fail open (allow request)
      return { allowed: true, remaining: max, resetAt: now + this.windowMs };
    }
  }
}
