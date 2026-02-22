"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { QrModal } from "./qr-modal";

interface QrButtonProps {
  url: string;
}

export function QrButton({ url }: QrButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/70 active:scale-[0.97]"
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </button>
      <QrModal url={url} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
