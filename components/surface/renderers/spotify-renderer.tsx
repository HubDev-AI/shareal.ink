"use client";

import { motion } from "motion/react";
import type { RendererProps } from "./renderer-props";
import { TruncatedText } from "../shared/truncated-text";
import { IframeWithFallback } from "../shared/iframe-with-fallback";

function getSpotifyEmbedUrl(space: RendererProps["space"]): string | null {
  if (space.extras?.embedUrl) {
    try {
      const u = new URL(space.extras.embedUrl);
      if (u.hostname === "open.spotify.com") return space.extras.embedUrl;
    } catch { /* ignore */ }
    return null;
  }
  if (!space.originalUrl) return null;
  try {
    const u = new URL(space.originalUrl);
    if (u.hostname !== "open.spotify.com") return null;
    const m = u.pathname.match(/^\/(track|album|playlist|episode)\/([^/?]+)/);
    if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
  } catch { /* ignore */ }
  return null;
}

export function SpotifyRenderer({ space }: RendererProps) {
  const embedUrl = getSpotifyEmbedUrl(space);
  const isCompact = space.extras?.contentType === "track" || space.extras?.contentType === "episode";

  return (
    <>
      {embedUrl ? (
        <IframeWithFallback
          src={embedUrl}
          fallbackImage={space.imageUrl}
          fallbackUrl={space.originalUrl}
          title={space.title ?? "Spotify"}
          className={`w-full rounded-t-2xl ${isCompact ? "h-[152px]" : "h-[352px]"}`}
          allow="encrypted-media"
        />
      ) : space.originalUrl ? (
        <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-32 w-full items-center justify-center rounded-t-2xl bg-gradient-to-br from-green-500/10 to-green-700/10 text-white/40 hover:text-white/60 transition-colors">
          <span className="text-sm">Listen on Spotify</span>
        </a>
      ) : null}

      <div className="px-6 pt-5">
        {space.title && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}>
            <TruncatedText text={space.title} href={space.originalUrl} />
          </motion.div>
        )}
        {space.description && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-3">
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
