"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface ActionButtonProps {
  token: string;
  label: string;
  initialCount: number;
  onCountChange: (count: number) => void;
}

export function ActionButton({ token, label, initialCount, onCountChange }: ActionButtonProps) {
  const [responded, setResponded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`shareal:${token}`);
    if (stored === "yes") setResponded(true);
  }, [token]);

  const handleClick = async () => {
    if (responded || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/spaces/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseType: "yes" }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponded(true);
        localStorage.setItem(`shareal:${token}`, "yes");
        onCountChange(data.count);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  if (responded) {
    return (
      <button
        disabled
        className="flex w-full cursor-default items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-3.5 text-base font-medium text-emerald-300"
      >
        <Check className="h-5 w-5" />
        You&apos;re in!
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-xl bg-white py-3.5 text-base font-semibold text-[#040c1f] transition-all active:scale-[0.97] hover:bg-white/90 disabled:opacity-50"
    >
      {loading ? (
        <svg className="mx-auto h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        label
      )}
    </button>
  );
}
