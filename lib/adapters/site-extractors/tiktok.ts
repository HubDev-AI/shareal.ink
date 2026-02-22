import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const tiktokExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      return new URL(finalUrl).hostname.includes("tiktok.com");
    } catch { return false; }
  },
  extract(finalUrl: string, _og: OgMetadata) {
    const extras: Record<string, string> = { resolvedUrl: finalUrl };
    const m = finalUrl.match(/\/video\/(\d+)/);
    if (m) extras.videoId = m[1];
    return { extras };
  },
};
