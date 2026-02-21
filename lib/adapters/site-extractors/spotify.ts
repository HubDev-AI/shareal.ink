import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const spotifyExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      return new URL(finalUrl).hostname === "open.spotify.com";
    } catch { return false; }
  },
  extract(finalUrl: string, _og: OgMetadata) {
    const extras: Record<string, string> = { resolvedUrl: finalUrl };
    try {
      const u = new URL(finalUrl);
      const m = u.pathname.match(/^\/(track|album|playlist|episode)\/([^/?]+)/);
      if (m) {
        extras.embedUrl = `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
        extras.contentType = m[1];
        extras.contentId = m[2];
      }
    } catch { /* ignore */ }
    return { extras };
  },
};
