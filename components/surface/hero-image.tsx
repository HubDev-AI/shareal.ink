"use client";

import Image from "next/image";
import { useState } from "react";
import type { LinkType } from "@/lib/types";

const gradients: Record<LinkType, string> = {
  restaurant: "from-orange-200 to-amber-100",
  video: "from-purple-200 to-indigo-100",
  event: "from-blue-200 to-cyan-100",
  generic: "from-gray-200 to-slate-100",
};

interface HeroImageProps {
  imageUrl: string | null;
  title: string | null;
  linkType: LinkType;
}

export function HeroImage({ imageUrl, title, linkType }: HeroImageProps) {
  const [error, setError] = useState(false);

  if (!imageUrl || error) {
    return (
      <div
        className={`h-48 w-full rounded-t-[var(--radius-lg)] bg-gradient-to-br ${gradients[linkType]}`}
      />
    );
  }

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-t-[var(--radius-lg)]">
      <Image
        src={imageUrl}
        alt={title ?? "Surface image"}
        fill
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
        priority
      />
    </div>
  );
}
