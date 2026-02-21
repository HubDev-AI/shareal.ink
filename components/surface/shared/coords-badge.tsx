"use client";

import { useState } from "react";
import { MapPin, Copy, Check } from "lucide-react";

interface CoordsBadgeProps {
  coords: string;
}

/** Clickable coordinates badge — click to copy lat,lng */
export function CoordsBadge({ coords }: CoordsBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] tabular-nums text-white/50 transition-colors hover:bg-white/10 hover:text-white/70 active:scale-[0.97]"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <MapPin className="h-3.5 w-3.5 text-cyan-400/60" />
      )}
      <span>{copied ? "Copied!" : coords}</span>
      {!copied && <Copy className="h-3 w-3 text-white/25" />}
    </button>
  );
}
