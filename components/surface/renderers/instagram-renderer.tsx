"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Instagram, Play } from "lucide-react";
import type { RendererProps } from "./renderer-props";
import { TruncatedText } from "../shared/truncated-text";

function getEmbedUrl(space: RendererProps["space"]): string | null {
  const shortcode = space.extras?.shortcode;
  if (shortcode) return `https://www.instagram.com/p/${shortcode}/embed/`;
  return null;
}

export function InstagramRenderer({ space }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const embedUrl = getEmbedUrl(space);
  const thumbnail = space.imageUrl;

  return (
    <>
      {playing && embedUrl ? (
        <div className="relative aspect-square max-h-64 w-full overflow-hidden rounded-t-2xl bg-white">
          <iframe
            src={embedUrl}
            title={space.title ?? "Instagram post"}
            className="absolute inset-0 h-full w-full border-0"
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
        <div className="group relative aspect-square max-h-64 w-full overflow-hidden rounded-t-2xl">
          <Image src={thumbnail} alt={space.title ?? "Instagram post"} fill
                 className="object-cover" onError={() => setImgError(true)} unoptimized priority />
          <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
          <button type="button"
                  onClick={() => embedUrl ? setPlaying(true) : space.originalUrl && window.open(space.originalUrl, "_blank")}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
              <Instagram className="h-6 w-6 text-white" />
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
      ) : space.originalUrl ? (
        <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-32 w-full items-center justify-center gap-2 rounded-t-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-white/40 hover:text-white/60 transition-colors">
          <Instagram className="h-5 w-5" />
          <span className="text-sm">View on Instagram</span>
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
