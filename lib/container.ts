import { RegexLinkDetector } from "@/lib/adapters/regex-link-detector";
import { InMemoryRateLimiter } from "@/lib/adapters/in-memory-rate-limiter";
import { NoopAuthProvider } from "@/lib/adapters/noop-auth";
import { NoopAnalytics } from "@/lib/adapters/noop-analytics";
import { PassthroughImageStore } from "@/lib/adapters/passthrough-image-store";
import { MetascraperOgFetcher } from "@/lib/adapters/metascraper-og-fetcher";
import { BullMQAdapter } from "@/lib/adapters/bullmq-adapter";
import type { IOgFetcher, IQueue, IAuthProvider, IAnalytics, IRateLimiter, ILinkDetector, IImageStore } from "@/lib/interfaces";

export const ogFetcher: IOgFetcher = new MetascraperOgFetcher();
export const queue: IQueue = new BullMQAdapter();
export const auth: IAuthProvider = new NoopAuthProvider();
export const analytics: IAnalytics = new NoopAnalytics();
export const rateLimiter: IRateLimiter = new InMemoryRateLimiter();
export const linkDetector: ILinkDetector = new RegexLinkDetector();
export const imageStore: IImageStore = new PassthroughImageStore();
