"use client";

import { useState } from "react";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviewContent } from "./preview-content";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function InstagramPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
      {loading && !imageUrl ? (
        <Skeleton className="aspect-square max-h-64 w-full rounded-none" />
      ) : imageUrl && !imageError ? (
        <div className="relative aspect-square max-h-64 w-full">
          <Image
            src={imageUrl}
            alt={displayTitle ?? "Instagram post"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg">
              <Instagram className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      ) : null}

      <PreviewContent linkType={linkType} loading={loading} title={displayTitle} description={metadata?.description ?? null} />
    </>
  );
}
