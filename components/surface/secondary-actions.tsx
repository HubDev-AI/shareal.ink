"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Share2 } from "lucide-react";

interface SecondaryActionsProps {
  originalUrl: string | null;
  shareUrl: string;
  title: string | null;
}

export function SecondaryActions({ originalUrl, shareUrl, title }: SecondaryActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? "shareal.ink", url: shareUrl });
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex gap-2">
      {originalUrl && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" />
          Open link
        </a>
      )}
      <Button variant="secondary" className="flex-1" onClick={handleCopy}>
        <Copy className="h-4 w-4" />
        {copied ? "Copied!" : "Copy link"}
      </Button>
      <Button variant="ghost" className="flex-1" onClick={handleShare}>
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
