"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ExternalLink, Loader2 } from "lucide-react";

type Status = "loading" | "loaded" | "failed";

interface IframeWithFallbackProps {
  src: string;
  fallbackImage: string | null;
  fallbackUrl: string | null;
  title: string;
  className?: string;
  iframeClassName?: string;
  timeout?: number;
  allow?: string;
  allowFullScreen?: boolean;
  onLoaded?: () => void;
  onFailed?: () => void;
}

export function IframeWithFallback({
  src,
  fallbackImage,
  fallbackUrl,
  title,
  className = "",
  iframeClassName = "",
  timeout = 8000,
  allow,
  allowFullScreen,
  onLoaded,
  onFailed,
}: IframeWithFallbackProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start timeout timer
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setStatus((prev) => {
        if (prev === "loading") {
          onFailed?.();
          return "failed";
        }
        return prev;
      });
    }, timeout);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeout, onFailed]);

  const handleLoad = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus((prev) => {
      if (prev === "loading") {
        onLoaded?.();
        return "loaded";
      }
      return prev;
    });
  }, [onLoaded]);

  const handleError = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("failed");
    onFailed?.();
  }, [onFailed]);

  const showImage = fallbackImage && !imgError;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base layer: OG image or placeholder */}
      <div data-testid="fallback-layer" className="absolute inset-0">
        {showImage ? (
          <Image
            src={fallbackImage}
            alt={title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div
            data-testid="placeholder"
            className="flex h-full w-full items-center justify-center bg-white/[0.03]"
          >
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        )}
      </div>

      {/* Iframe layer */}
      {status !== "failed" && (
        <div
          data-testid="iframe-layer"
          className={`absolute inset-0 transition-opacity duration-500 ${
            status === "loaded"
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <iframe
            src={src}
            title={title}
            className={`h-full w-full border-0 ${iframeClassName}`}
            allow={allow}
            allowFullScreen={allowFullScreen}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      )}

      {/* Failed overlay */}
      {status === "failed" && fallbackUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <ExternalLink className="h-4 w-4" />
            Open original
          </a>
        </div>
      )}
    </div>
  );
}
