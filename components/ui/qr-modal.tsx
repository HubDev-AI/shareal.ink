"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import QRCode from "qrcode";

const QR_DARK = "#040c1f";

// 9x8 pixel-art fox face
const FOX_GRID = [
  [1,0,0,0,0,0,0,0,1],
  [1,1,0,0,0,0,0,1,1],
  [0,1,1,1,1,1,1,1,0],
  [0,1,0,1,1,1,0,1,0],
  [0,1,1,1,1,1,1,1,0],
  [0,0,1,0,1,0,1,0,0],
  [0,0,0,1,1,1,0,0,0],
  [0,0,0,0,1,0,0,0,0],
];

const FOX_COLS = FOX_GRID[0].length;
const FOX_ROWS = FOX_GRID.length;

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

        // Determine module size from QR code
        const moduleCount = QRCode.create(url, { errorCorrectionLevel: "H" }).modules.size;
        const totalModules = moduleCount + 4; // margin: 2 on each side
        const moduleSize = canvas.width / totalModules;

        const foxW = FOX_COLS * moduleSize;
        const foxH = FOX_ROWS * moduleSize;
        const offsetX = (canvas.width - foxW) / 2;
        const offsetY = (canvas.height - foxH) / 2;

        // Clear background for fox area (with 1-module padding)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(offsetX - moduleSize, offsetY - moduleSize, foxW + moduleSize * 2, foxH + moduleSize * 2);

        // Draw fox pixels
        ctx.fillStyle = QR_DARK;
        for (let r = 0; r < FOX_ROWS; r++) {
          for (let c = 0; c < FOX_COLS; c++) {
            if (FOX_GRID[r][c]) {
              ctx.fillRect(offsetX + c * moduleSize, offsetY + r * moduleSize, moduleSize, moduleSize);
            }
          }
        }
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
              <svg className="absolute inset-0 m-3" viewBox="0 0 256 256" aria-hidden="true">
                {(() => {
                  const moduleSize = 256 / (QRCode.create(url, { errorCorrectionLevel: "H" }).modules.size + 4);
                  const foxW = FOX_COLS * moduleSize;
                  const foxH = FOX_ROWS * moduleSize;
                  const ox = (256 - foxW) / 2;
                  const oy = (256 - foxH) / 2;
                  const rects: React.ReactElement[] = [];
                  // White background
                  rects.push(<rect key="bg" x={ox - moduleSize} y={oy - moduleSize} width={foxW + moduleSize * 2} height={foxH + moduleSize * 2} fill="#ffffff" />);
                  // Fox pixels
                  for (let r = 0; r < FOX_ROWS; r++) {
                    for (let c = 0; c < FOX_COLS; c++) {
                      if (FOX_GRID[r][c]) {
                        rects.push(<rect key={`${r}-${c}`} x={ox + c * moduleSize} y={oy + r * moduleSize} width={moduleSize} height={moduleSize} fill={QR_DARK} />);
                      }
                    }
                  }
                  return rects;
                })()}
              </svg>
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
