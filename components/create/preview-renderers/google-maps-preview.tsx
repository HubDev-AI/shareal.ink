"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

function getStaticMapUrl(metadata: PreviewRendererProps["metadata"]): string | null {
  const coords = metadata?.extras?.coords;
  if (coords) {
    const q = encodeURIComponent(coords.replace(/\s/g, ""));
    return `https://maps.googleapis.com/maps/api/staticmap?center=${q}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${q}&key=`;
  }
  return null;
}

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
              <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-2">
                {displayTitle}
              </h3>
            )}
            {displayDescription && (
              <p className="text-sm text-muted line-clamp-2">{displayDescription}</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
