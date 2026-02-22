"use client";

import { getDocSubType } from "@/lib/config/doc-sub-type";
import { PreviewContent } from "./preview-content";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function GoogleDocPreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;
  const sub = getDocSubType(originalUrl);
  const Icon = sub.icon;

  return (
    <>
      <div className={`flex h-32 w-full items-center justify-center gap-3 bg-gradient-to-br ${sub.gradientFrom} ${sub.gradientTo}`}>
        <Icon className={`h-10 w-10 ${sub.iconColor}`} />
        <span className="text-sm font-medium text-foreground/50">{sub.label}</span>
      </div>

      <PreviewContent linkType={linkType} loading={loading} title={displayTitle} description={metadata?.description ?? null} />
    </>
  );
}
