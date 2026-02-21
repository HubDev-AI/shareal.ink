"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Play } from "lucide-react";
import type { RendererProps } from "./renderer-props";

function getTikTokEmbedUrl(space: RendererProps["space"]): string | null {
  const videoId = space.extras?.videoId;
  if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`;
  return null;
}

export function TikTokRenderer({ space }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const embedUrl = getTikTokEmbedUrl(space);
  const thumbnail = space.imageUrl;

  const handlePlay = () => {
    if (embedUrl) setPlaying(true);
    else if (space.originalUrl) window.open(space.originalUrl, "_blank");
  };

  return (
    <>
      {playing && embedUrl ? (
        <div className="relative mx-auto w-full max-w-[325px] overflow-hidden rounded-2xl bg-black m-3 mb-0">
          <iframe
            src={embedUrl}
            title={space.title ?? "TikTok video"}
            className="h-[575px] w-full border-0"
            allowFullScreen
            allow="encrypted-media"
          />
          {space.originalUrl && (
            <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
               className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
          )}
        </div>
      ) : thumbnail && !imgError ? (
        <div className="group relative aspect-[9/16] max-h-96 w-full overflow-hidden rounded-2xl ring-2 ring-[#69C9D0]/50 m-3 mb-0">
          <Image src={thumbnail} alt={space.title ?? "TikTok video"} fill
                 className="object-cover" onError={() => setImgError(true)} unoptimized priority />
          <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
          <button type="button" onClick={handlePlay}
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
      ) : embedUrl ? (
        <button type="button" onClick={handlePlay}
                className="group flex h-40 w-full cursor-pointer items-center justify-center gap-3 rounded-t-2xl bg-white/[0.03] transition-colors hover:bg-white/[0.06]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition-transform group-hover:scale-110">
            <Play className="ml-0.5 h-5 w-5 fill-white/60 text-white/60" />
          </div>
          <span className="text-sm text-white/40 group-hover:text-white/60">Play TikTok</span>
        </button>
      ) : space.originalUrl ? (
        <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-32 w-full items-center justify-center rounded-t-2xl bg-white/[0.03] text-white/40 hover:text-white/60 transition-colors">
          <span className="text-sm">View on TikTok</span>
        </a>
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
