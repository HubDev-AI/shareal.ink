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
      const scraper = await createScraper();
      const metadata = await scraper({ html, url });

      return {
        title: metadata.title || null,
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
