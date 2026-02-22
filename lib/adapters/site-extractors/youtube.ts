import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const youtubeExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      const u = new URL(finalUrl);
      return (
        u.hostname === "www.youtube.com" ||
        u.hostname === "youtube.com" ||
        u.hostname === "m.youtube.com" ||
        u.hostname === "youtu.be"
      );
    } catch {
      return false;
    }
  },

  extract(finalUrl: string, og: OgMetadata) {
    const videoId = extractVideoId(finalUrl);
    const extras: Record<string, string> = {};
    if (videoId) extras.videoId = videoId;

    if (videoId && (!og.imageUrl || og.imageUrl.includes("hqdefault"))) {
      return {
        imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        extras,
      };
    }

    return { extras };
  },
};

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);

    // youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }

    // youtube.com/watch?v=VIDEO_ID
    const v = u.searchParams.get("v");
    if (v) return v;

    // youtube.com/shorts/VIDEO_ID or /embed/VIDEO_ID or /live/VIDEO_ID
    const pathMatch = u.pathname.match(/\/(shorts|embed|live|v)\/([^/?]+)/);
    if (pathMatch) return pathMatch[2];
  } catch {
    // ignore
  }
  return null;
}
