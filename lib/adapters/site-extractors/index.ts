import type { OgMetadata } from "@/lib/types";
import type { SiteExtractor } from "./types";
import { googleMapsExtractor } from "./google-maps";
import { youtubeExtractor } from "./youtube";
import { instagramExtractor } from "./instagram";
import { tiktokExtractor } from "./tiktok";
import { spotifyExtractor } from "./spotify";
import { xTwitterExtractor } from "./x-twitter";

/**
 * All registered site extractors. Order doesn't matter —
 * only the first matching extractor is applied.
 * Add new extractors here as new files.
 */
const extractors: SiteExtractor[] = [
  googleMapsExtractor,
  youtubeExtractor,
  instagramExtractor,
  tiktokExtractor,
  spotifyExtractor,
  xTwitterExtractor,
];

/**
 * Run site-specific extraction to enhance generic OG metadata.
 * Returns the enriched metadata (non-null overrides applied).
 */
export function enhanceMetadata(finalUrl: string, og: OgMetadata): OgMetadata {
  for (const extractor of extractors) {
    if (extractor.matches(finalUrl)) {
      const overrides = extractor.extract(finalUrl, og);
      return {
        title: overrides.title !== undefined ? overrides.title : og.title,
        description: overrides.description !== undefined ? overrides.description : og.description,
        imageUrl: overrides.imageUrl !== undefined ? overrides.imageUrl : og.imageUrl,
        extras: overrides.extras ?? og.extras ?? null,
      };
    }
  }
  return og;
}
