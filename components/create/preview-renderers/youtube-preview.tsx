"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviewContent } from "./preview-content";
import type { PreviewRendererProps } from "./preview-renderer-props";

function getVideoId(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = u.pathname.match(/\/(shorts|embed|live|v)\/([^/?]+)/);
    if (m) return m[2];
  } catch { /* ignore */ }
  return null;
}

export function YouTubePreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;

  const videoId = getVideoId(originalUrl) ?? (metadata?.extras?.videoId ?? null);
  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : metadata?.imageUrl;

  return (
    <>
      {loading && !thumbnail ? (
        <Skeleton className="aspect-video max-h-64 w-full rounded-none" />
      ) : thumbnail && !imageError ? (
        <div className="relative aspect-video max-h-64 w-full">
          <Image
            src={thumbnail}
            alt={displayTitle ?? "YouTube video"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg">
              <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
            </div>
          </div>
        </div>
      ) : null}

      <PreviewContent linkType={linkType} loading={loading} title={displayTitle} description={metadata?.description ?? null} />
    </>
  );
}
