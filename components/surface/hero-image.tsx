"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { LinkType } from "@/lib/types";

interface HeroImageProps {
  imageUrl: string | null;
  title: string | null;
  linkType: LinkType;
  originalUrl: string | null;
}

export function HeroImage({ imageUrl, title, originalUrl }: HeroImageProps) {
  const [error, setError] = useState(false);

  if (!imageUrl || error) {
    // Show the original URL in a styled block when no image
    if (originalUrl) {
      return (
        <div className="flex h-32 w-full items-center justify-center rounded-t-2xl bg-white/5 px-6">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/70"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="break-all line-clamp-2">{originalUrl}</span>
          </a>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-t-2xl">
      <Image
        src={imageUrl}
        alt={title ?? "Surface image"}
        fill
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
        priority
      />
    </div>
  );
}
