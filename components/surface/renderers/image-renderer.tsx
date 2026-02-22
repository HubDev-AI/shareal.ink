"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { RendererProps } from "./renderer-props";
import { RendererContent } from "../shared/renderer-content";

export function ImageRenderer({ space }: RendererProps) {
  const [imgError, setImgError] = useState(false);
  const imageSrc = space.originalUrl ?? space.imageUrl;

  return (
    <>
      {imageSrc && !imgError ? (
        <div className="group relative max-h-64 w-full overflow-hidden rounded-t-2xl bg-black/20">
          <Image
            src={imageSrc}
            alt={space.title ?? "Image"}
            width={720}
            height={480}
            className="w-full object-contain max-h-64"
            onError={() => setImgError(true)}
            unoptimized
            priority
          />
          {space.originalUrl && (
            <a
              href={space.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
          )}
        </div>
      ) : null}

      <RendererContent title={space.title} description={space.description} href={space.originalUrl} />
    </>
  );
}
