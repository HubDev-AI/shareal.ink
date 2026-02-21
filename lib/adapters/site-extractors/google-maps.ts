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

      // /maps/place/Place+Name/@lat,lng
      const placeMatch = u.pathname.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        const name = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
        if (name) {
          return {
            title: name,
            description: buildDescription(og.description, coords),
          };
        }
      }

      // /maps/search/Query/@lat,lng
      const searchMatch = u.pathname.match(/\/maps\/search\/([^/@]+)/);
      if (searchMatch) {
        const query = decodeURIComponent(searchMatch[1].replace(/\+/g, " ")).trim();
        if (query) {
          return {
            title: query,
            description: buildDescription(og.description, coords),
          };
        }
      }

      // No place/search match but still a maps link — keep OG, add coords
      if (coords) {
        return { description: buildDescription(og.description, coords) };
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

function buildDescription(ogDesc: string | null, coords: string | null): string {
  // If OG has a real (non-generic) description, use it + append coords
  if (!isGenericDescription(ogDesc)) {
    return coords ? `${ogDesc}\n${coords}` : ogDesc!;
  }
  // Otherwise build from coords
  if (coords) return coords;
  return "View on Google Maps";
}
