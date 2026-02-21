"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

function getSpotifyEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== "open.spotify.com") return null;
    const m = u.pathname.match(/^\/(track|album|playlist|episode)\/([^/?]+)/);
    if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
  } catch { /* ignore */ }
  return null;
}

export function SpotifyPreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const embedUrl = getSpotifyEmbedUrl(originalUrl);

  return (
    <>
      {/* Compact Spotify embed */}
      {loading && !embedUrl ? (
        <Skeleton className="h-[152px] w-full rounded-none" />
      ) : embedUrl ? (
        <iframe
          src={embedUrl}
          title={displayTitle ?? "Spotify"}
          className="h-[152px] w-full border-0"
          allow="encrypted-media"
          loading="lazy"
        />
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
