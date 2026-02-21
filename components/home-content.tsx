"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NyraHero } from "@/components/nyra/nyra-hero";
import { CreateForm } from "@/components/create/create-form";

export function HomeContent() {
  const [previewing, setPreviewing] = useState(false);

  return (
    <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
      <AnimatePresence>
        {!previewing && (
          <motion.div
            key="nyra"
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <NyraHero />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          shareal<span className="text-cyan-300">.ink</span>
        </h1>
        <p className="text-sm text-white/60">Share a link. Make it make sense.</p>
      </div>
      <CreateForm onPreviewChange={setPreviewing} />
    </div>
  );
}
