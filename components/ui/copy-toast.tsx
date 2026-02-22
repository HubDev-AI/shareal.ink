"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function CopyToast() {
  const [visible, setVisible] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    try {
      const copied = sessionStorage.getItem("link-copied");
      if (!copied) return;

      // Defer state update to avoid synchronous setState in effect
      const showTimer = setTimeout(() => setVisible(true), 0);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        try { sessionStorage.removeItem("link-copied"); } catch {}
      }, 2500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    } catch {}
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed top-6 left-1/2 z-50 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md"
        >
          Link copied to clipboard
        </motion.div>
      )}
    </AnimatePresence>
  );
}
