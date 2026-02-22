"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function GoogleMapsPreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
      {/* Map thumbnail */}
      {loading && !imageUrl ? (
        <Skeleton className="h-[200px] w-full rounded-none" />
      ) : imageUrl && !imageError ? (
        <div className="relative h-[200px] w-full">
          <Image
            src={imageUrl}
            alt={displayTitle ?? "Map"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-[200px] w-full items-center justify-center bg-white/[0.03]">
          <MapPin className="h-10 w-10 text-white/20" />
        </div>
      )}

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
