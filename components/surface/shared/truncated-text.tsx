"use client";

import { useState, useRef, useEffect } from "react";
import { sanitizeHref } from "@/lib/security";

interface TruncatedTextProps {
  text: string;
  href?: string | null;
  className?: string;
}

export function TruncatedText({
  text,
  href,
  className = "",
}: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  const safeHref = sanitizeHref(href);
  const baseClass = `text-[22px] font-semibold leading-tight tracking-tight text-white ${expanded ? "" : "line-clamp-2"} ${className}`;

  const content = safeHref ? (
    <a
      ref={textRef as React.Ref<HTMLAnchorElement>}
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} transition-colors hover:text-cyan-200`}
    >
      {text}
    </a>
  ) : (
    <span ref={textRef as React.Ref<HTMLSpanElement>} className={baseClass}>
      {text}
    </span>
  );

  return (
    <div>
      {content}
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-[13px] font-medium text-cyan-400/60 transition-colors hover:text-cyan-400"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
