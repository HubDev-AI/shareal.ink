"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { HeroImage } from "./hero-image";
import { ActionButton } from "./action-button";
import { ResponseCounter } from "./response-counter";
import { SecondaryActions } from "./secondary-actions";
import { CoordsBadge } from "./coords-badge";
import { linkTypeConfig } from "@/lib/config/link-types";
import { defaultTheme } from "@/lib/config/themes";
import type { SpaceData } from "@/lib/types";

const COORDS_RE = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;

interface SurfaceCardProps {
  space: SpaceData;
}

export function SurfaceCard({ space }: SurfaceCardProps) {
  const [count, setCount] = useState(space.responseCount);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink"}/${space.token}`;
  const config = linkTypeConfig[space.linkType];
  const theme = defaultTheme;
  const showAction = config.showAction;
  const isTextOnly = !space.originalUrl && !space.imageUrl;

  // Extract coordinates from description (injected by Google Maps extractor)
  const coordsMatch = space.description?.match(COORDS_RE);
  const coords = coordsMatch ? `${coordsMatch[1]}, ${coordsMatch[2]}` : null;
  const descriptionText = coords
    ? space.description!.replace(COORDS_RE, "").replace(/\n+$/, "").trim() || null
    : space.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`${theme.card} mx-auto ${theme.cardWidth}`}
    >
      {!isTextOnly && (
        <HeroImage
          imageUrl={space.imageUrl}
          title={space.title}
          linkType={space.linkType}
          originalUrl={space.originalUrl}
        />
      )}

      <div className={`space-y-5 ${isTextOnly ? "px-8 py-8 sm:px-12 sm:py-10 text-center" : "p-6 pt-5"}`}>
        {/* Title + description */}
        <div>
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

          {descriptionText && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-4"
            >
              {descriptionText}
            </motion.p>
          )}

          {coords && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="mt-3"
            >
              <CoordsBadge coords={coords} />
            </motion.div>
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

        {/* Ghost echo — full URL whisper */}
        {space.originalUrl && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="break-all text-center text-[11px] tracking-wide text-white/20"
          >
            {space.originalUrl}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
