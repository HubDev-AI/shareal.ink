"use client";

import { createElement } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { getPreviewRenderer } from "./preview-renderers";
import type { LinkType, OgMetadata } from "@/lib/types";

interface LinkPreviewProps {
  linkType: LinkType;
  metadata: OgMetadata | null;
  loading: boolean;
  title: string | null;
  originalUrl?: string | null;
  className?: string;
}

export function LinkPreview({ linkType, metadata, loading, title, originalUrl, className }: LinkPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm", className)}
    >
      {createElement(getPreviewRenderer(linkType), {
        linkType,
        metadata,
        loading,
        title,
        originalUrl: originalUrl ?? null,
      })}
    </motion.div>
  );
}
