"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useCallback, useEffect, useRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const resize = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => {
      resize();
    }, [props.value, resize]);

    return (
      <div className="w-full">
        <textarea
          ref={(node) => {
            internalRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          rows={1}
          className={cn(
            "w-full resize-none rounded-[var(--radius-lg)] border bg-surface px-5 py-5 text-base shadow-sm transition-colors",
            "placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
            error ? "border-red-400" : "border-border",
            className
          )}
          onChange={(e) => {
            onChange?.(e);
            resize();
          }}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
