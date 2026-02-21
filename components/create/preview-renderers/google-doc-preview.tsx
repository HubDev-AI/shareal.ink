"use client";

import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function GoogleDocPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;

  return (
    <>
      {/* FileText icon with blue gradient background */}
      <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-blue-500/15 to-blue-700/10">
        <FileText className="h-10 w-10 text-blue-400/70" />
      </div>

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
