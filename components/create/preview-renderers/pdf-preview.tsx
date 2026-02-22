"use client";

import { FileText } from "lucide-react";
import { PreviewContent } from "./preview-content";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function PdfPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;

  return (
    <>
      <div className="flex h-32 w-full items-center justify-center gap-3 bg-gradient-to-br from-red-500/15 to-red-700/10">
        <FileText className="h-10 w-10 text-red-400/70" />
        <span className="text-sm font-medium text-foreground/50">PDF Document</span>
      </div>

      <PreviewContent linkType={linkType} loading={loading} title={displayTitle} description={metadata?.description ?? null} />
    </>
  );
}
