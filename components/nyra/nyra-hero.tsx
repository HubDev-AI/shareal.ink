"use client";

import Image from "next/image";
import { motion } from "motion/react";

interface NyraHeroProps {
  className?: string;
}

export function NyraHero({ className }: NyraHeroProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1.02, 1] }}
      transition={{
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
      }}
      className={className}
    >
      <Image
        src="/nyra/nyra-hero.png"
        alt="Nyra"
        width={192}
        height={192}
        priority
        className="pointer-events-none select-none"
      />
    </motion.div>
  );
}
