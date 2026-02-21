"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "w-full rounded-[var(--radius-lg)] border bg-surface px-5 py-4 text-base shadow-sm transition-colors",
            "placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
            error ? "border-red-400" : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
