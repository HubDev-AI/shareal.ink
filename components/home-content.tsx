"use client";

import { useState } from "react";
import { NyraHero } from "@/components/nyra/nyra-hero";
import { CreateForm } from "@/components/create/create-form";

export function HomeContent() {
  const [previewing, setPreviewing] = useState(false);

  return (
    <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
      <div
        className="grid transition-all duration-400 ease-in-out"
        style={{
          gridTemplateRows: previewing ? "0fr" : "1fr",
          opacity: previewing ? 0 : 1,
          scale: previewing ? "0.9" : "1",
        }}
      >
        <div className="overflow-hidden">
          <div className="flex justify-center">
            <NyraHero />
          </div>
        </div>
      </div>
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
