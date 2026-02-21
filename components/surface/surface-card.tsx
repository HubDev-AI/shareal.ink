"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { HeroImage } from "./hero-image";
import { ActionButton } from "./action-button";
import { ResponseCounter } from "./response-counter";
import { SecondaryActions } from "./secondary-actions";
import type { SpaceData } from "@/lib/types";

/** Link types that support the RSVP / "Interested" action */
const ACTIONABLE_TYPES = new Set(["restaurant", "event"]);

interface SurfaceCardProps {
  space: SpaceData;
}

export function SurfaceCard({ space }: SurfaceCardProps) {
  const [count, setCount] = useState(space.responseCount);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink"}/${space.token}`;
  const showAction = ACTIONABLE_TYPES.has(space.linkType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-surface mx-auto w-full min-w-[340px] max-w-lg"
    >
      <HeroImage
        imageUrl={space.imageUrl}
        title={space.title}
        linkType={space.linkType}
        originalUrl={space.originalUrl}
      />

      <div className="space-y-5 p-6 pt-5">
        {/* Title + description — clickable */}
        <div>
          {space.title && (
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-[22px] font-semibold leading-tight tracking-tight text-white"
            >
              {space.originalUrl ? (
                <a
                  href={space.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-cyan-200"
                >
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
              className="mt-2 text-[15px] leading-relaxed text-white/45 line-clamp-3"
            >
              {space.description}
            </motion.p>
          )}
        </div>

        {/* RSVP action — only for places/events */}
        {showAction && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <ActionButton
              token={space.token}
              label={space.primaryActionLabel}
              initialCount={count}
              onCountChange={setCount}
            />
          </motion.div>
        )}

        {showAction && <ResponseCounter count={count} />}

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <SecondaryActions
            originalUrl={space.originalUrl}
            shareUrl={shareUrl}
            title={space.title}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
