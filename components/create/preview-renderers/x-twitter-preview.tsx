"use client";

import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviewContent } from "./preview-content";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function XTwitterPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
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
            alt={displayTitle ?? "Post"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        </div>
      ) : null}

      <PreviewContent linkType={linkType} loading={loading} title={displayTitle} description={metadata?.description ?? null} />
    </>
  );
}
