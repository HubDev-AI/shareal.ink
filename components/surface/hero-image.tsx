"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { linkTypeConfig } from "@/lib/config/link-types";
import type { LinkType } from "@/lib/types";

interface HeroImageProps {
  imageUrl: string | null;
  title: string | null;
  linkType: LinkType;
  originalUrl: string | null;
}

export function HeroImage({ imageUrl, title, linkType, originalUrl }: HeroImageProps) {
  const [error, setError] = useState(false);
  const config = linkTypeConfig[linkType];
  const isVideo = linkType === "video";

  // No image — show URL if available
  if (!imageUrl || error) {
    if (originalUrl) {
      return (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex h-28 w-full items-center justify-center rounded-t-2xl bg-white/[0.03] px-6 transition-colors hover:bg-white/[0.06]"
        >
          <span className="flex items-center gap-2 text-sm text-white/30 transition-colors group-hover:text-white/55">
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cyan-400/50" />
            <span className="break-all line-clamp-2">{originalUrl}</span>
          </span>
        </a>
      );
    }
    return null;
  }

  const imageContent = (
    <div className={`group relative ${config.imageHeight} w-full overflow-hidden rounded-t-2xl`}>
      <Image
        src={imageUrl}
        alt={title ?? "Surface image"}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        onError={() => setError(true)}
        unoptimized
        priority
      />
      {/* Blue tint overlay */}
      {config.imageOverlay && (
        <div className="absolute inset-0 bg-[#040c1f]/25 mix-blend-multiply" />
      )}

      {isVideo ? (
        <>
          {/* Dark scrim for video */}
          <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
          {/* Centered play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6 fill-[#040c1f] text-[#040c1f]" />
            </div>
          </div>
          {/* Top-right external link */}
          {originalUrl && (
            <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </div>
          )}
        </>
      ) : (
        /* Generic hover indicator */
        originalUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
            <ExternalLink className="h-6 w-6 text-white drop-shadow-lg" />
          </div>
        )
      )}
    </div>
  );

  if (originalUrl) {
    return (
      <a href={originalUrl} target="_blank" rel="noopener noreferrer">
        {imageContent}
      </a>
    );
  }

  return imageContent;
}
