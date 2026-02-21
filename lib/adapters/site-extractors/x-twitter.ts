import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const xTwitterExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      const h = new URL(finalUrl).hostname;
      return h === "x.com" || h === "www.x.com" || h.includes("twitter.com");
    } catch { return false; }
  },
  extract(finalUrl: string, _og: OgMetadata) {
    const extras: Record<string, string> = { resolvedUrl: finalUrl };
    const m = finalUrl.match(/\/status\/(\d+)/);
    if (m) extras.tweetId = m[1];
    return { extras };
  },
};
