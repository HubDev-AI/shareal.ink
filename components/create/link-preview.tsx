"use client";

import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { LinkType, OgMetadata } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

interface LinkPreviewProps {
  linkType: LinkType;
  metadata: OgMetadata | null;
  loading: boolean;
  title: string | null;
}

export function LinkPreview({ linkType, metadata, loading, title }: LinkPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const imageUrl = metadata?.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm"
    >
      {/* Image */}
      {loading && !imageUrl ? (
        <Skeleton className="h-40 w-full rounded-none" />
      ) : imageUrl && !imageError ? (
        <div className="relative h-40 w-full">
          <Image
            src={imageUrl}
            alt={displayTitle ?? "Preview"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
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
    </motion.div>
  );
}
