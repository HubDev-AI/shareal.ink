"use client";

import { motion } from "motion/react";
import { TruncatedText } from "./truncated-text";

interface RendererContentProps {
  title: string | null;
  description: string | null;
  href?: string | null;
}

export function RendererContent({ title, description, href }: RendererContentProps) {
  return (
    <div className="px-6 pt-5">
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <TruncatedText text={title} href={href} />
        </motion.div>
      )}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-3"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
