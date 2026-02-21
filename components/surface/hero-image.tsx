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

/** Extract a YouTube embed URL from common YouTube link formats */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID or youtube.com/shorts/ID
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1`;
    }
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
  } catch { /* ignore */ }
  return null;
}

export function HeroImage({ imageUrl, title, linkType, originalUrl }: HeroImageProps) {
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const config = linkTypeConfig[linkType];
  const isVideo = linkType === "video";
  const embedUrl = isVideo && originalUrl ? getYouTubeEmbedUrl(originalUrl) : null;

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

  // Video is playing inline — show YouTube embed
  if (playing && embedUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-black">
        <iframe
          src={embedUrl}
          title={title ?? "Video"}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
        {/* Top-right external link to open on YouTube */}
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-opacity hover:bg-black/80"
          >
            <ExternalLink className="h-3.5 w-3.5 text-white" />
          </a>
        )}
      </div>
    );
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
          {/* Centered play button — clicking plays inline */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (embedUrl) {
                setPlaying(true);
              } else if (originalUrl) {
                window.open(originalUrl, "_blank", "noopener,noreferrer");
              }
            }}
            className="absolute inset-0 flex cursor-pointer items-center justify-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6 fill-[#040c1f] text-[#040c1f]" />
            </div>
          </button>
          {/* Top-right external link */}
          {originalUrl && (
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
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

  // For video, don't wrap in <a> — play button handles interaction
  if (isVideo) {
    return imageContent;
  }

  if (originalUrl) {
    return (
      <a href={originalUrl} target="_blank" rel="noopener noreferrer">
        {imageContent}
      </a>
    );
  }

  return imageContent;
}
