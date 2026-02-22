"use client";

import { useState } from "react";
import Image from "next/image";
import { Music } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviewContent } from "./preview-content";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function SpotifyPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
      {loading && !imageUrl ? (
        <Skeleton className="h-40 w-full rounded-none" />
      ) : imageUrl && !imageError ? (
        <div className="relative h-40 w-full">
          <Image
            src={imageUrl}
            alt={displayTitle ?? "Spotify"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954] shadow-lg">
              <Music className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-green-500/15 to-green-700/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954]/80">
            <Music className="h-5 w-5 text-white" />
          </div>
        </div>
      )}

      <PreviewContent linkType={linkType} loading={loading} title={displayTitle} description={metadata?.description ?? null} />
    </>
  );
}
