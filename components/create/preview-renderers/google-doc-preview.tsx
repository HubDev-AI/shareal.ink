"use client";

import { FileText, FileSpreadsheet, Presentation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";
import type { LucideIcon } from "lucide-react";

interface DocSubType {
  icon: LucideIcon;
  label: string;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
}

function getDocSubType(url: string | null): DocSubType {
  if (url) {
    if (/sheets\.google\.com/i.test(url)) {
      return {
        icon: FileSpreadsheet,
        label: "Google Sheets",
        gradientFrom: "from-green-500/15",
        gradientTo: "to-green-700/10",
        iconColor: "text-green-400/70",
      };
    }
    if (/slides\.google\.com/i.test(url)) {
      return {
        icon: Presentation,
        label: "Google Slides",
        gradientFrom: "from-yellow-500/15",
        gradientTo: "to-yellow-700/10",
        iconColor: "text-yellow-400/70",
      };
    }
  }
  return {
    icon: FileText,
    label: "Google Doc",
    gradientFrom: "from-blue-500/15",
    gradientTo: "to-blue-700/10",
    iconColor: "text-blue-400/70",
  };
}

export function GoogleDocPreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const sub = getDocSubType(originalUrl);
  const Icon = sub.icon;

  return (
    <>
      <div className={`flex h-32 w-full items-center justify-center gap-3 bg-gradient-to-br ${sub.gradientFrom} ${sub.gradientTo}`}>
        <Icon className={`h-10 w-10 ${sub.iconColor}`} />
        <span className="text-sm font-medium text-foreground/50">{sub.label}</span>
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
