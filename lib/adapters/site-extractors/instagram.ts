import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const instagramExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      return new URL(finalUrl).hostname.includes("instagram.com");
    } catch { return false; }
  },
  extract(finalUrl: string, _og: OgMetadata) {
    const m = finalUrl.match(/\/(p|reel|tv)\/([^/?]+)/);
    const extras: Record<string, string> = {};
    if (m) extras.shortcode = m[2];
    extras.resolvedUrl = finalUrl;
    return { extras };
  },
};
