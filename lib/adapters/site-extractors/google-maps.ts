import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

const GENERIC_DESCRIPTIONS = [
  "find local businesses, view maps and get driving directions in google maps.",
  "find local businesses, view maps and get driving directions in google maps",
];

export const googleMapsExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      const u = new URL(finalUrl);
      return (
        u.hostname.includes("google") && u.pathname.includes("/maps")
      ) || u.hostname === "maps.app.goo.gl";
    } catch {
      return false;
    }
  },

  extract(finalUrl: string, og: OgMetadata) {
    try {
      const u = new URL(finalUrl);
      const coords = extractCoords(u.pathname + u.search);

      const extras: Record<string, string> = {};
      if (coords) extras.coords = coords;
      extras.resolvedUrl = finalUrl;

      const placeMatch = u.pathname.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        const name = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
        if (name) {
          return {
            title: name,
            description: isGenericDescription(og.description) ? null : og.description,
            extras,
          };
        }
      }

      const searchMatch = u.pathname.match(/\/maps\/search\/([^/@]+)/);
      if (searchMatch) {
        const query = decodeURIComponent(searchMatch[1].replace(/\+/g, " ")).trim();
        if (query) {
          return {
            title: query,
            description: isGenericDescription(og.description) ? null : og.description,
            extras,
          };
        }
      }

      if (coords) {
        return {
          description: isGenericDescription(og.description) ? null : og.description,
          extras,
        };
      }
    } catch {
      // ignore
    }

    return {};
  },
};

/** Extract lat,lng from @lat,lng,zoom pattern in the URL */
function extractCoords(path: string): string | null {
  const m = path.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (!m) return null;
  return `${m[1]}, ${m[2]}`;
}

function isGenericDescription(desc: string | null): boolean {
  if (!desc) return true;
  return GENERIC_DESCRIPTIONS.includes(desc.toLowerCase().trim());
}
