"use client";

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
  const Renderer = getPreviewRenderer(linkType);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm", className)}
    >
      <Renderer linkType={linkType} metadata={metadata} loading={loading} title={title} originalUrl={originalUrl ?? null} />
    </motion.div>
  );
}
