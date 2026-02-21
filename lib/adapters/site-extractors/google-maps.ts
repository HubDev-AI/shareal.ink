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

      // /maps/place/Place+Name/@lat,lng
      const placeMatch = u.pathname.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        const name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        return {
          title: name,
          description: isGenericDescription(og.description) ? null : og.description,
        };
      }

      // /maps/search/Query/@lat,lng
      const searchMatch = u.pathname.match(/\/maps\/search\/([^/@]+)/);
      if (searchMatch) {
        const query = decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
        return {
          title: query,
          description: isGenericDescription(og.description) ? null : og.description,
        };
      }
    } catch {
      // ignore
    }

    return {};
  },
};

function isGenericDescription(desc: string | null): boolean {
  if (!desc) return true;
  return GENERIC_DESCRIPTIONS.includes(desc.toLowerCase().trim());
}
