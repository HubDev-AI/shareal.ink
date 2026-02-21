"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { getRenderer } from "./renderers";
import { ActionButton } from "./shared/action-button";
import { ResponseCounter } from "./shared/response-counter";
import { SecondaryActions } from "./shared/secondary-actions";
import { formatRelativeTime } from "@/lib/format-time";
import { linkTypeConfig } from "@/lib/config/link-types";
import { defaultTheme } from "@/lib/config/themes";
import type { SpaceData } from "@/lib/types";

interface SurfaceCardProps {
  space: SpaceData;
}

export function SurfaceCard({ space }: SurfaceCardProps) {
  const [count, setCount] = useState(space.responseCount);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink"}/${space.token}`;
  const config = linkTypeConfig[space.linkType];
  const theme = defaultTheme;
  const showAction = config.showAction;
  const Renderer = getRenderer(space.linkType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`${theme.card} mx-auto ${theme.cardWidth}`}
    >
      <Renderer space={space} theme={theme} />

      {space.intentText && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-6 mb-2 px-6 text-center text-[17px] font-medium text-cyan-200/80"
        >
          {space.intentText}
        </motion.p>
      )}

      <div className="space-y-5 p-6 pt-5">
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="text-right text-[11px] text-white/20"
        >
          {formatRelativeTime(new Date(space.createdAt))}
        </motion.p>
      </div>
    </motion.div>
  );
}
