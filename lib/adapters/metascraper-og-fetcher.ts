import type { IOgFetcher } from "@/lib/interfaces";
import type { OgMetadata } from "@/lib/types";
import { enhanceMetadata } from "./site-extractors";
import { isUrlSafe } from "@/lib/security";

// Dynamic imports — server-only, avoid bundling issues
async function createScraper() {
  const metascraper = (await import("metascraper")).default;
  const title = (await import("metascraper-title")).default;
  const description = (await import("metascraper-description")).default;
  const image = (await import("metascraper-image")).default;
  return metascraper([title(), description(), image()]);
}

export class MetascraperOgFetcher implements IOgFetcher {
  async fetch(url: string): Promise<OgMetadata> {
    if (!isUrlSafe(url)) {
      return { title: null, description: null, imageUrl: null };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await globalThis.fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SharealBot/1.0; +https://shareal.ink)",
        },
      });
      const html = await response.text();
      const finalUrl = response.url; // expanded URL after redirects
      const scraper = await createScraper();
      const raw = await scraper({ html, url: finalUrl });

      const og: OgMetadata = {
        title: raw.title || null,
        description: raw.description || null,
        imageUrl: raw.image || null,
      };

      // Apply site-specific enhancements
      return enhanceMetadata(finalUrl, og);
    } catch {
      try {
        const hostname = new URL(url).hostname.replace("www.", "");
        return { title: hostname, description: null, imageUrl: null };
      } catch {
        return { title: null, description: null, imageUrl: null };
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
