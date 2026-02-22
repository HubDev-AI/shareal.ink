"use client";

import { IframeWithFallback } from "../shared/iframe-with-fallback";
import { RendererContent } from "../shared/renderer-content";
import type { RendererProps } from "./renderer-props";

function getEmbedUrl(space: RendererProps["space"]): string | null {
  const coords = space.extras?.coords;
  const title = space.title;

  if (title && coords) {
    const q = encodeURIComponent(`${title} @${coords}`);
    return `https://maps.google.com/maps?q=${q}&output=embed`;
  }
  if (coords) {
    return `https://maps.google.com/maps?q=${coords.replace(/\s/g, "")}&output=embed`;
  }
  if (space.originalUrl) {
    const encoded = encodeURIComponent(space.originalUrl);
    return `https://maps.google.com/maps?q=${encoded}&output=embed`;
  }
  return null;
}

export function GoogleMapsRenderer({ space }: RendererProps) {
  const embedUrl = getEmbedUrl(space);

  return (
    <>
      {embedUrl ? (
        <IframeWithFallback
          src={embedUrl}
          fallbackImage={space.imageUrl}
          fallbackUrl={space.originalUrl}
          title={space.title ?? "Map"}
          className="aspect-[16/10] w-full rounded-t-2xl"
          allowFullScreen
        />
      ) : space.originalUrl ? (
        <a
          href={space.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-32 w-full items-center justify-center rounded-t-2xl bg-white/[0.03] text-white/30 hover:bg-white/[0.06] transition-colors"
        >
          Open in Google Maps
        </a>
      ) : null}

      <RendererContent title={space.title} description={space.description} href={space.originalUrl} />
    </>
  );
}
