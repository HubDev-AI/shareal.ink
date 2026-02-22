"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";

interface VoteButtonsProps {
  token: string;
}

export function VoteButtons({ token }: VoteButtonsProps) {
  const [vote, setVote] = useState<"yes" | "no" | null>(null);
  const [yesCount, setYesCount] = useState(0);
  const [noCount, setNoCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`shareal:vote:${token}`);
    if (stored === "yes" || stored === "no") setVote(stored);
  }, [token]);

  const handleVote = async (responseType: "yes" | "no") => {
    if (vote || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/spaces/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseType }),
      });

      if (res.ok) {
        const data = await res.json();
        setVote(responseType);
        localStorage.setItem(`shareal:vote:${token}`, responseType);
        setYesCount(data.yesCount ?? 0);
        setNoCount(data.noCount ?? 0);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  if (vote) {
    return (
      <div className="flex w-full items-center justify-center gap-3">
        <div
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-base font-medium ${
            vote === "yes"
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-white/5 text-white/30"
          }`}
        >
          {vote === "yes" && <Check className="h-4 w-4" />}
          <ThumbsUp className="h-4 w-4" />
          {yesCount > 0 && <span>{yesCount}</span>}
        </div>
        <div
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-base font-medium ${
            vote === "no"
              ? "bg-red-500/20 text-red-300"
              : "bg-white/5 text-white/30"
          }`}
        >
          {vote === "no" && <Check className="h-4 w-4" />}
          <ThumbsDown className="h-4 w-4" />
          {noCount > 0 && <span>{noCount}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full gap-3">
      <button
        onClick={() => handleVote("yes")}
        disabled={loading}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-base font-semibold text-[#040c1f] transition-all active:scale-[0.97] hover:bg-white/90 disabled:opacity-50"
      >
        <ThumbsUp className="h-4 w-4" />
        Yes
      </button>
      <button
        onClick={() => handleVote("no")}
        disabled={loading}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-base font-semibold text-white transition-all active:scale-[0.97] hover:bg-white/10 disabled:opacity-50"
      >
        <ThumbsDown className="h-4 w-4" />
        No
      </button>
    </div>
  );
}
