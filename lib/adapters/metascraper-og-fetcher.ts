import type { IOgFetcher } from "@/lib/interfaces";
import type { OgMetadata } from "@/lib/types";

// Dynamic imports — server-only, avoid bundling issues
async function createScraper() {
  const metascraper = (await import("metascraper")).default;
  const title = (await import("metascraper-title")).default;
  const description = (await import("metascraper-description")).default;
  const image = (await import("metascraper-image")).default;
  return metascraper([title(), description(), image()]);
}

/**
 * Extract a meaningful title from the final (expanded) URL for sites
 * where OG metadata is generic (e.g. Google Maps returns "Google Maps").
 * This is the same approach used by WhatsApp, Telegram, and Slack.
 */
function extractTitleFromUrl(finalUrl: string): string | null {
  try {
    const u = new URL(finalUrl);

    // Google Maps: /maps/place/Place+Name/@lat,lng or /place/Place+Name/...
    const placeMatch = u.pathname.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    }

    // Google Maps: /maps/search/Query/@lat,lng
    const searchMatch = u.pathname.match(/\/maps\/search\/([^/@]+)/);
    if (searchMatch) {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
    }
  } catch {
    // ignore
  }
  return null;
}

/** Check if a title is generic / uninformative (just the site name). */
function isGenericTitle(title: string | null): boolean {
  if (!title) return true;
  const generic = ["google maps", "youtube", "facebook", "instagram", "x"];
  return generic.includes(title.toLowerCase().trim());
}

export class MetascraperOgFetcher implements IOgFetcher {
  async fetch(url: string): Promise<OgMetadata> {
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
      const metadata = await scraper({ html, url: finalUrl });

      let title = metadata.title || null;

      // If the OG title is generic, try to extract a better one from the URL
      if (isGenericTitle(title)) {
        const urlTitle = extractTitleFromUrl(finalUrl);
        if (urlTitle) title = urlTitle;
      }

      return {
        title,
        description: metadata.description || null,
        imageUrl: metadata.image || null,
      };
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
