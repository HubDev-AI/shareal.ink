"use client";

import { motion } from "motion/react";
import type { RendererProps } from "./renderer-props";

function getTikTokEmbedUrl(space: RendererProps["space"]): string | null {
  const videoId = space.extras?.videoId;
  if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`;
  return null;
}

export function TikTokRenderer({ space }: RendererProps) {
  const embedUrl = getTikTokEmbedUrl(space);

  return (
    <>
      {embedUrl ? (
        <div className="relative mx-auto w-full max-w-[325px] overflow-hidden rounded-t-2xl bg-black">
          <iframe
            src={embedUrl}
            title={space.title ?? "TikTok video"}
            className="h-[575px] w-full border-0"
            allowFullScreen
            allow="encrypted-media"
          />
        </div>
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
