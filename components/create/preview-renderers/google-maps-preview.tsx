"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

function getEmbedUrl(url: string | null, metadata: PreviewRendererProps["metadata"]): string | null {
  const coords = metadata?.extras?.coords;
  const title = metadata?.title;

  if (title && coords) {
    const q = encodeURIComponent(`${title} @${coords}`);
    return `https://maps.google.com/maps?q=${q}&output=embed`;
  }
  if (coords) {
    return `https://maps.google.com/maps?q=${coords.replace(/\s/g, "")}&output=embed`;
  }
  if (url) {
    const encoded = encodeURIComponent(url);
    return `https://maps.google.com/maps?q=${encoded}&output=embed`;
  }
  return null;
}

export function GoogleMapsPreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const embedUrl = getEmbedUrl(originalUrl, metadata);

  return (
    <>
      {/* Mini map iframe */}
      {loading && !embedUrl ? (
        <Skeleton className="h-[200px] w-full rounded-none" />
      ) : embedUrl ? (
        <div className="relative h-[200px] w-full overflow-hidden">
          <iframe
            src={embedUrl}
            title={displayTitle ?? "Map"}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
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
