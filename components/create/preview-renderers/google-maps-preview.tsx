"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviewContent } from "./preview-content";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function GoogleMapsPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
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

      <PreviewContent linkType={linkType} loading={loading} title={displayTitle} description={metadata?.description ?? null} />
    </>
  );
}
