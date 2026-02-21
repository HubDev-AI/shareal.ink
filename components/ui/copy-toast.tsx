"use client";

import { useEffect, useState } from "react";

export function CopyToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("link-copied")) {
        setVisible(true);
        const timer = setTimeout(() => {
          setVisible(false);
          try { sessionStorage.removeItem("link-copied"); } catch {}
        }, 2500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md"
    >
      Link copied to clipboard
    </div>
  );
}
