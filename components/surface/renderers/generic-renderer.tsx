"use client";

import { motion } from "motion/react";
import { HeroImage } from "../shared/hero-image";
import type { RendererProps } from "./renderer-props";

export function GenericRenderer({ space, theme }: RendererProps) {
  const isTextOnly = !space.originalUrl && !space.imageUrl;

  return (
    <>
      {!isTextOnly && (
        <HeroImage
          imageUrl={space.imageUrl}
          title={space.title}
          linkType={space.linkType}
          originalUrl={space.originalUrl}
        />
      )}

      <div className={isTextOnly ? "px-8 py-8 sm:px-12 sm:py-10 text-center" : "px-6 pt-5"}>
        {space.title && (
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className={
              isTextOnly
                ? `${space.title.length <= 40 ? "text-3xl sm:text-5xl font-semibold leading-tight tracking-tight" : theme.textTitle} bg-gradient-to-br from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent`
                : "text-[22px] font-semibold leading-tight tracking-tight text-white"
            }
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
