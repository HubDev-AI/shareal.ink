import type { OgMetadata } from "@/lib/types";

export interface SiteExtractorResult {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  extras?: Record<string, string>;
}

/**
 * A site extractor can override OG metadata for specific domains
 * where the standard OG tags are generic or unhelpful.
 */
export interface SiteExtractor {
  /** Return true if this extractor handles the given URL. */
  matches(finalUrl: string): boolean;
  /** Extract better metadata. Only non-null fields override OG defaults. */
  extract(finalUrl: string, ogMetadata: OgMetadata): SiteExtractorResult;
}
