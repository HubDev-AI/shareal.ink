"use client";

import { useState, createElement } from "react";
import { motion } from "motion/react";
import { getRenderer } from "./renderers";
import { ActionButton } from "./shared/action-button";
import { ResponseCounter } from "./shared/response-counter";
import { VoteButtons } from "./shared/vote-buttons";
import { SecondaryActions } from "./shared/secondary-actions";
import { IntentMarkdown } from "./shared/intent-markdown";
import { formatRelativeTime } from "@/lib/format-time";
import { defaultTheme } from "@/lib/config/themes";
import type { SpaceData } from "@/lib/types";

interface SurfaceCardProps {
  space: SpaceData;
}

function getDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function SurfaceCard({ space }: SurfaceCardProps) {
  const [count, setCount] = useState(space.responseCount);
  const theme = defaultTheme;
  const domain = getDomain(space.originalUrl);
  const timestamp = formatRelativeTime(new Date(space.createdAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`${theme.card} mx-auto ${theme.cardWidth}`}
    >
      {createElement(getRenderer(space.linkType), { space, theme })}

      {space.intentText && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <IntentMarkdown text={space.intentText} />
        </motion.div>
      )}

      <div className="space-y-4 p-6 pt-3">
        {space.intentType === "meet" && (
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

        {space.intentType === "meet" && <ResponseCounter count={count} />}

        {space.intentType === "vote" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <VoteButtons token={space.token} />
          </motion.div>
        )}

        <SecondaryActions originalUrl={space.originalUrl} />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="text-center text-[11px] tracking-wide text-white/20"
        >
          {domain ? `${domain} \u00b7 ${timestamp}` : timestamp}
        </motion.p>
      </div>
    </motion.div>
  );
}
