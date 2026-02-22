"use client";

import { motion } from "motion/react";
import { IframeWithFallback } from "../shared/iframe-with-fallback";
import { TruncatedText } from "../shared/truncated-text";
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

      <div className="px-6 pt-5">
        {space.title && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}>
            <TruncatedText text={space.title} href={space.originalUrl} />
          </motion.div>
        )}

        {space.description && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-3"
          >
            {space.description}
          </motion.p>
        )}

      </div>
    </>
  );
}
