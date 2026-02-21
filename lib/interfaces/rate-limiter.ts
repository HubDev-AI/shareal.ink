export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface IRateLimiter {
  check(key: string): Promise<RateLimitResult>;
}
