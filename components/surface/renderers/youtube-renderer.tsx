"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Play } from "lucide-react";
import type { RendererProps } from "./renderer-props";

function getVideoId(space: RendererProps["space"]): string | null {
  if (space.extras?.videoId) return space.extras.videoId;
  if (!space.originalUrl) return null;
  try {
    const u = new URL(space.originalUrl);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = u.pathname.match(/\/(shorts|embed|live|v)\/([^/?]+)/);
    if (m) return m[2];
  } catch { /* ignore */ }
  return null;
}

export function YouTubeRenderer({ space }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const videoId = getVideoId(space);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : space.imageUrl;

  return (
    <>
      {playing && embedUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-black">
          <iframe
            src={embedUrl}
            title={space.title ?? "Video"}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
          {space.originalUrl && (
            <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
               className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
          )}
        </div>
      ) : thumbnail && !imgError ? (
        <div className="group relative aspect-video w-full overflow-hidden rounded-t-2xl">
          <Image src={thumbnail} alt={space.title ?? "Video thumbnail"} fill
                 className="object-cover" onError={() => setImgError(true)} unoptimized priority />
          <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
          <button type="button"
                  onClick={() => embedUrl ? setPlaying(true) : space.originalUrl && window.open(space.originalUrl, "_blank")}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6 fill-[#040c1f] text-[#040c1f]" />
            </div>
          </button>
          {space.originalUrl && (
            <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
          )}
        </div>
      ) : null}

      <div className="px-6 pt-5">
        {space.title && (
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.15, duration: 0.3 }}
                     className="text-[22px] font-semibold leading-tight tracking-tight text-white">
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : space.title}
          </motion.h1>
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
