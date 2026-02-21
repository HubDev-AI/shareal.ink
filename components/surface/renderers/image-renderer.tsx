"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import type { RendererProps } from "./renderer-props";

export function ImageRenderer({ space }: RendererProps) {
  const [imgError, setImgError] = useState(false);
  const imageSrc = space.originalUrl ?? space.imageUrl;

  return (
    <>
      {imageSrc && !imgError ? (
        <div className="group relative max-h-96 w-full overflow-hidden rounded-t-2xl bg-black/20">
          <Image
            src={imageSrc}
            alt={space.title ?? "Image"}
            width={720}
            height={480}
            className="w-full object-contain max-h-96"
            onError={() => setImgError(true)}
            unoptimized
            priority
          />
          {space.originalUrl && (
            <a
              href={space.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
          )}
        </div>
      ) : null}

      <div className="px-6 pt-5">
        {space.title && (
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="text-[22px] font-semibold leading-tight tracking-tight text-white"
          >
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : (
              space.title
            )}
          </motion.h1>
        )}
        {space.description && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-4"
          >
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
