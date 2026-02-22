"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import QRCode from "qrcode";

const QR_DARK = "#040c1f";
const LOGO_PATH = "/nyra/nyra-icon.png";

interface QrModalProps {
  url: string;
  open: boolean;
  onClose: () => void;
}

export function QrModal({ url, open, onClose }: QrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    QRCode.toString(url, { type: "svg", margin: 2, width: 256, errorCorrectionLevel: "H" }).then((svg) => {
      setSvgDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    });

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        margin: 2,
        width: 512,
        color: { dark: QR_DARK, light: "#ffffff" },
        errorCorrectionLevel: "H",
      }).then(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const logo = new Image();
        logo.onload = () => {
          const logoSize = 80;
          const pad = 14;
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;

          // White background behind logo
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);

          // Draw logo (PNG has its own transparency)
          ctx.drawImage(logo, x, y, logoSize, logoSize);
        };
        logo.src = LOGO_PATH;
      });
    }
  }, [url, open]);

  if (!open) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `shareal-qr-${url.split("/").pop()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-xs rounded-2xl border border-white/10 bg-[#0a1628]/95 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white/70">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4">
          <h3 className="text-sm font-medium text-white/60">Scan to open</h3>

          {svgDataUrl && (
            <div className="relative rounded-xl bg-white p-3">
              <img src={svgDataUrl} alt="QR Code" className="h-48 w-48" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white p-2">
                  <img src={LOGO_PATH} alt="" className="h-8 w-8" />
                </div>
              </div>
            </div>
          )}

          <p className="break-all text-center text-xs text-white/30">{url}</p>

          <button type="button" onClick={handleDownload}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/15 hover:text-white">
            <Download className="h-3.5 w-3.5" />
            Download PNG
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
