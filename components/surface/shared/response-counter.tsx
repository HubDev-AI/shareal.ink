"use client";

import { AnimatePresence, motion } from "motion/react";

interface ResponseCounterProps {
  count: number;
}

export function ResponseCounter({ count }: ResponseCounterProps) {
  if (count === 0) return null;

  const label = count === 1 ? "person is in" : "people are in";

  return (
    <div className="text-center text-sm text-white/35">
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.3 }}
        >
          {count} {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
