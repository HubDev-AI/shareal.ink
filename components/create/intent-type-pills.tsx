"use client";

import type { IntentType } from "@/lib/types";

interface IntentTypePillsProps {
  value: IntentType;
  onChange: (type: IntentType) => void;
  disabled?: boolean;
}

const pills: { type: IntentType; label: string }[] = [
  { type: "meet", label: "Meet" },
  { type: "vote", label: "Vote" },
  { type: "share", label: "Share" },
];

export function IntentTypePills({ value, onChange, disabled }: IntentTypePillsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {pills.map(({ type, label }) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onChange(type)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            value === type
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
