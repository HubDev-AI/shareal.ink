"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { Instagram } from "lucide-react";
import type { RendererProps } from "./renderer-props";

export function InstagramRenderer({ space }: RendererProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <>
      {space.imageUrl && !imgError ? (
        <a href={space.originalUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="group block">
          <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl">
            <Image src={space.imageUrl} alt={space.title ?? "Instagram post"} fill
                   className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                   onError={() => setImgError(true)} unoptimized priority />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
              <Instagram className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
        </a>
      ) : space.originalUrl ? (
        <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-32 w-full items-center justify-center gap-2 rounded-t-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-white/40 hover:text-white/60 transition-colors">
          <Instagram className="h-5 w-5" />
          <span className="text-sm">View on Instagram</span>
        </a>
      ) : null}

      <div className="px-6 pt-5">
        {space.title && (
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.15, duration: 0.3 }}
                     className="text-[22px] font-semibold leading-tight tracking-tight text-white">
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : space.title}
          </motion.h1>
        )}
        {space.description && (
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
