import { RegexLinkDetector } from "@/lib/adapters/regex-link-detector";
import { InMemoryRateLimiter } from "@/lib/adapters/in-memory-rate-limiter";
import { RedisRateLimiter } from "@/lib/adapters/redis-rate-limiter";
import { NoopAuthProvider } from "@/lib/adapters/noop-auth";
import { NoopAnalytics } from "@/lib/adapters/noop-analytics";
import { PlausibleAnalytics } from "@/lib/adapters/plausible-analytics";
import { BullMQAdapter } from "@/lib/adapters/bullmq-adapter";
import type { IQueue, IAuthProvider, IAnalytics, IRateLimiter, ILinkDetector } from "@/lib/interfaces";
import { PLAUSIBLE_DOMAIN, PLAUSIBLE_API_URL, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/lib/env";

export const queue: IQueue = new BullMQAdapter();
export const auth: IAuthProvider = new NoopAuthProvider();
export const analytics: IAnalytics = PLAUSIBLE_DOMAIN
  ? new PlausibleAnalytics(PLAUSIBLE_DOMAIN, PLAUSIBLE_API_URL)
  : new NoopAnalytics();
export const rateLimiter: IRateLimiter = process.env.REDIS_URL
  ? new RedisRateLimiter(process.env.REDIS_URL, RATE_LIMIT_MAX, 30, RATE_LIMIT_WINDOW_MS)
  : (() => {
      if (process.env.NODE_ENV === "production") {
        console.warn("[container] REDIS_URL not set — using in-memory rate limiter (not shared across instances)");
      }
      return new InMemoryRateLimiter();
    })();
export const linkDetector: ILinkDetector = new RegexLinkDetector();
