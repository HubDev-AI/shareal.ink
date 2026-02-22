"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title?: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? "shareal.ink", url });
      } catch {
        // User cancelled — ignore
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/70 active:scale-[0.97]"
    >
      <Share2 className="h-4 w-4" />
      {shared ? "Copied!" : "Share"}
    </button>
  );
}
