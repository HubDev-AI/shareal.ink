"use client";

import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviewContent } from "./preview-content";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function ImagePreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageSrc = originalUrl ?? metadata?.imageUrl;

  return (
    <>
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

      <PreviewContent linkType={linkType} loading={loading} title={displayTitle} description={metadata?.description ?? null} />
    </>
  );
}
