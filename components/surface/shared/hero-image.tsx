"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { linkTypeConfig } from "@/lib/config/link-types";
import { sanitizeHref } from "@/lib/security";
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
  const safeUrl = sanitizeHref(originalUrl);

  if (!imageUrl || error) {
    if (safeUrl) {
      return (
        <a
          href={safeUrl}
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
      {config.imageOverlay && (
        <div className="absolute inset-0 bg-[#040c1f]/25 mix-blend-multiply" />
      )}
      {safeUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
          <ExternalLink className="h-6 w-6 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  );

  if (safeUrl) {
    return (
      <a href={safeUrl} target="_blank" rel="noopener noreferrer">
        {imageContent}
      </a>
    );
  }

  return imageContent;
}
