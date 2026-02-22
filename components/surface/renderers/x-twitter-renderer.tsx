"use client";

import { HeroImage } from "../shared/hero-image";
import { RendererContent } from "../shared/renderer-content";
import type { RendererProps } from "./renderer-props";

export function XTwitterRenderer({ space }: RendererProps) {
  return (
    <>
      <HeroImage
        imageUrl={space.imageUrl}
        title={space.title}
        linkType={space.linkType}
        originalUrl={space.originalUrl}
      />

      <RendererContent title={space.title} description={space.description} href={space.originalUrl} />
    </>
  );
}
