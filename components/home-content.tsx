"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { NyraHero } from "@/components/nyra/nyra-hero";
import { CreateForm } from "@/components/create/create-form";

export function HomeContent() {
  const [previewing, setPreviewing] = useState(false);

  return (
    <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
      <motion.div
        className="flex justify-center overflow-hidden"
        animate={{
          height: previewing ? 0 : "auto",
          opacity: previewing ? 0 : 1,
          scale: previewing ? 0.9 : 1,
          marginBottom: previewing ? -32 : 0,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <NyraHero />
      </motion.div>
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
