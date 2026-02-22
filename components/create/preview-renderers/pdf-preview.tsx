"use client";

import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function PdfPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;

  return (
    <>
      <div className="flex h-32 w-full items-center justify-center gap-3 bg-gradient-to-br from-red-500/15 to-red-700/10">
        <FileText className="h-10 w-10 text-red-400/70" />
        <span className="text-sm font-medium text-foreground/50">PDF Document</span>
      </div>

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
              <h3 className="mb-1 text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
                {displayTitle}
              </h3>
            )}
            {displayDescription && (
              <p className="text-[13px] leading-relaxed text-muted line-clamp-2">{displayDescription}</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
