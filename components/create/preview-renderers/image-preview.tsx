"use client";

import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function ImagePreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const imageSrc = originalUrl ?? metadata?.imageUrl;

  return (
    <>
      {/* Actual image with object-contain */}
      {loading && !imageSrc ? (
        <Skeleton className="h-48 w-full rounded-none" />
      ) : imageSrc && !imageError ? (
        <div className="flex w-full items-center justify-center bg-black/10">
          <Image
            src={imageSrc}
            alt={displayTitle ?? "Image"}
            width={720}
            height={480}
            className="max-h-48 w-full object-contain"
            onError={() => setImageError(true)}
            unoptimized
          />
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
