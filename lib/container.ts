import { RegexLinkDetector } from "@/lib/adapters/regex-link-detector";
import { InMemoryRateLimiter } from "@/lib/adapters/in-memory-rate-limiter";
import { UpstashRateLimiter } from "@/lib/adapters/upstash-rate-limiter";
import { NoopAuthProvider } from "@/lib/adapters/noop-auth";
import { NoopAnalytics } from "@/lib/adapters/noop-analytics";
import { PlausibleAnalytics } from "@/lib/adapters/plausible-analytics";
import { BullMQAdapter } from "@/lib/adapters/bullmq-adapter";
import type { IQueue, IAuthProvider, IAnalytics, IRateLimiter, ILinkDetector } from "@/lib/interfaces";
import { PLAUSIBLE_DOMAIN, PLAUSIBLE_API_URL, UPSTASH_REDIS_REST_URL } from "@/lib/env";

export const queue: IQueue = new BullMQAdapter();
export const auth: IAuthProvider = new NoopAuthProvider();
export const analytics: IAnalytics = PLAUSIBLE_DOMAIN
  ? new PlausibleAnalytics(PLAUSIBLE_DOMAIN, PLAUSIBLE_API_URL)
  : new NoopAnalytics();
export const rateLimiter: IRateLimiter = UPSTASH_REDIS_REST_URL
  ? new UpstashRateLimiter()
  : (() => {
      if (process.env.NODE_ENV === "production") {
        console.warn("[container] UPSTASH_REDIS_REST_URL not set — using in-memory rate limiter (not shared across instances)");
      }
      return new InMemoryRateLimiter();
    })();
export const linkDetector: ILinkDetector = new RegexLinkDetector();
