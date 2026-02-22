"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function TikTokPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
      {/* 9:16 aspect ratio thumbnail with play button */}
      {loading && !imageUrl ? (
        <Skeleton className="aspect-[9/16] max-h-48 w-full rounded-none" />
      ) : imageUrl && !imageError ? (
        <div className="relative aspect-[9/16] max-h-48 w-full">
          <Image
            src={imageUrl}
            alt={displayTitle ?? "TikTok video"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="ml-0.5 h-5 w-5 fill-[#040c1f] text-[#040c1f]" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <TypeBadge linkType={linkType} />
        </div>

        {loading && !displayTitle ? (
          <>
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            {displayTitle && (
              <h3 className="mb-1 text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
                {displayTitle}
              </h3>
            )}
            {displayDescription && (
              <p className="text-[13px] leading-relaxed text-muted line-clamp-2">{displayDescription}</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
