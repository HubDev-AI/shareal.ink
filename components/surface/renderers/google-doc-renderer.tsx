"use client";

import { ExternalLink } from "lucide-react";
import { getDocSubType } from "@/lib/config/doc-sub-type";
import type { RendererProps } from "./renderer-props";
import { RendererContent } from "../shared/renderer-content";

export function GoogleDocRenderer({ space }: RendererProps) {
  const sub = getDocSubType(space.originalUrl);
  const Icon = sub.icon;

  return (
    <>
      <a
        href={space.originalUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative flex h-32 w-full items-center justify-center gap-3 rounded-t-2xl bg-gradient-to-br ${sub.gradientFrom} ${sub.gradientTo} transition-colors`}
      >
        <Icon className={`h-10 w-10 ${sub.iconColor} transition-colors ${sub.iconHoverColor}`} />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">
            {sub.label}
          </span>
        </div>
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-3.5 w-3.5 text-white" />
        </div>
      </a>

      <RendererContent title={space.title} description={space.description} href={space.originalUrl} />
    </>
  );
}
