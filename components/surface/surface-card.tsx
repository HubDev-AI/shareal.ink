"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { HeroImage } from "./hero-image";
import { ActionButton } from "./action-button";
import { ResponseCounter } from "./response-counter";
import { SecondaryActions } from "./secondary-actions";
import { TypeBadge } from "@/components/ui/type-badge";
import type { SpaceData } from "@/lib/types";

interface SurfaceCardProps {
  space: SpaceData;
}

export function SurfaceCard({ space }: SurfaceCardProps) {
  const [count, setCount] = useState(space.responseCount);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink"}/${space.token}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm"
    >
      <HeroImage
        imageUrl={space.imageUrl}
        title={space.title}
        linkType={space.linkType}
      />

      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {space.title && (
              <motion.h1
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="text-xl font-bold text-foreground"
              >
                {space.title}
              </motion.h1>
            )}
            {space.description && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="mt-1 text-sm text-muted line-clamp-3"
              >
                {space.description}
              </motion.p>
            )}
          </div>
          <TypeBadge linkType={space.linkType} className="ml-3 shrink-0" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <ActionButton
            token={space.token}
            label={space.primaryActionLabel}
            initialCount={count}
            onCountChange={setCount}
          />
        </motion.div>

        <ResponseCounter count={count} />

        <SecondaryActions
          originalUrl={space.originalUrl}
          shareUrl={shareUrl}
          title={space.title}
        />
      </div>
    </motion.div>
  );
}
