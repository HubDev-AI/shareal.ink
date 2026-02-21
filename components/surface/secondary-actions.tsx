"use client";

import { useState } from "react";
import { ExternalLink, Share2 } from "lucide-react";

interface SecondaryActionsProps {
  originalUrl: string | null;
  shareUrl: string;
  title: string | null;
}

export function SecondaryActions({ originalUrl, shareUrl, title }: SecondaryActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? "shareal.ink", url: shareUrl });
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {originalUrl && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Open original
        </a>
      )}
      <button
        onClick={handleShare}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Share2 className="h-4 w-4" />
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
