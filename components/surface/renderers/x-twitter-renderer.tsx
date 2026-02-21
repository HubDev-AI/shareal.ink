"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { RendererProps } from "./renderer-props";

export function XTwitterRenderer({ space }: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tweetUrl = space.originalUrl;

  useEffect(() => {
    if (!tweetUrl || !containerRef.current) return;

    const win = window as typeof window & { twttr?: { widgets: { load: (el?: HTMLElement) => void } } };
    if (win.twttr?.widgets) {
      win.twttr.widgets.load(containerRef.current);
    } else {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, [tweetUrl]);

  return (
    <>
      {tweetUrl ? (
        <div ref={containerRef} className="w-full overflow-hidden rounded-t-2xl bg-white/[0.03] px-4 py-4">
          <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
            <a href={tweetUrl}>{space.title ?? "View post"}</a>
          </blockquote>
        </div>
      ) : null}

      <div className="px-6 pt-5">
        {space.title && !tweetUrl && (
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.15, duration: 0.3 }}
                     className="text-[22px] font-semibold leading-tight tracking-tight text-white">
            {space.title}
          </motion.h1>
        )}
        {space.description && !tweetUrl && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-4">
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
