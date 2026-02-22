# Iframe Fallback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an OG-image-base-layer + iframe-overlay pattern so broken embeds never show blank rectangles.

**Architecture:** A shared `<IframeWithFallback>` component renders the OG image as the base layer, loads the iframe invisibly on top, and fades it in on `load`. If the iframe times out (8s) or errors, the OG image stays visible with an "Open original" link. All 5 iframe-using renderers adopt this component.

**Tech Stack:** React, Next.js Image, Tailwind CSS transitions, Vitest + @testing-library/react

---

### Task 1: Create `<IframeWithFallback>` component — write tests

**Files:**
- Create: `lib/__tests__/iframe-with-fallback.test.tsx`

**Step 1: Write the failing tests**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { IframeWithFallback } from "@/components/surface/shared/iframe-with-fallback";

describe("IframeWithFallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders fallback image immediately", () => {
    render(
      <IframeWithFallback
        src="https://example.com/embed"
        fallbackImage="https://example.com/og.jpg"
        fallbackUrl="https://example.com"
        title="Test embed"
        className="aspect-video"
      />
    );
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
  });

  it("renders iframe element", () => {
    render(
      <IframeWithFallback
        src="https://example.com/embed"
        fallbackImage="https://example.com/og.jpg"
        fallbackUrl="https://example.com"
        title="Test embed"
        className="aspect-video"
      />
    );
    const iframe = document.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "https://example.com/embed");
  });

  it("iframe starts invisible (opacity-0)", () => {
    render(
      <IframeWithFallback
        src="https://example.com/embed"
        fallbackImage="https://example.com/og.jpg"
        fallbackUrl="https://example.com"
        title="Test embed"
        className="aspect-video"
      />
    );
    const iframeWrapper = document.querySelector("[data-testid='iframe-layer']");
    expect(iframeWrapper?.className).toContain("opacity-0");
  });

  it("iframe becomes visible after load event", () => {
    render(
      <IframeWithFallback
        src="https://example.com/embed"
        fallbackImage="https://example.com/og.jpg"
        fallbackUrl="https://example.com"
        title="Test embed"
        className="aspect-video"
      />
    );
    const iframe = document.querySelector("iframe")!;
    act(() => {
      iframe.dispatchEvent(new Event("load"));
    });
    const iframeWrapper = document.querySelector("[data-testid='iframe-layer']");
    expect(iframeWrapper?.className).toContain("opacity-100");
  });

  it("shows failed state after timeout", () => {
    render(
      <IframeWithFallback
        src="https://example.com/embed"
        fallbackImage="https://example.com/og.jpg"
        fallbackUrl="https://example.com"
        title="Test embed"
        className="aspect-video"
        timeout={5000}
      />
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/open original/i)).toBeInTheDocument();
  });

  it("calls onFailed callback on timeout", () => {
    const onFailed = vi.fn();
    render(
      <IframeWithFallback
        src="https://example.com/embed"
        fallbackImage="https://example.com/og.jpg"
        fallbackUrl="https://example.com"
        title="Test embed"
        className="aspect-video"
        timeout={5000}
        onFailed={onFailed}
      />
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onFailed).toHaveBeenCalledOnce();
  });

  it("does not show failed state if iframe loads before timeout", () => {
    render(
      <IframeWithFallback
        src="https://example.com/embed"
        fallbackImage="https://example.com/og.jpg"
        fallbackUrl="https://example.com"
        title="Test embed"
        className="aspect-video"
        timeout={5000}
      />
    );
    const iframe = document.querySelector("iframe")!;
    act(() => {
      iframe.dispatchEvent(new Event("load"));
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText(/open original/i)).not.toBeInTheDocument();
  });

  it("renders placeholder when no fallback image", () => {
    render(
      <IframeWithFallback
        src="https://example.com/embed"
        fallbackImage={null}
        fallbackUrl="https://example.com"
        title="Test embed"
        className="aspect-video"
      />
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // Should still have some visual placeholder
    const placeholder = document.querySelector("[data-testid='fallback-layer']");
    expect(placeholder).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun run test -- lib/__tests__/iframe-with-fallback.test.tsx`
Expected: FAIL — module not found

---

### Task 2: Create `<IframeWithFallback>` component — implement

**Files:**
- Create: `components/surface/shared/iframe-with-fallback.tsx`

**Step 1: Implement the component**

```tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

type IframeStatus = "loading" | "loaded" | "failed";

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
  const [status, setStatus] = useState<IframeStatus>("loading");
  const [imgError, setImgError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

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

  const handleLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("loaded");
    onLoaded?.();
  };

  const handleError = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("failed");
    onFailed?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Layer 1: Fallback image or placeholder */}
      <div data-testid="fallback-layer" className="absolute inset-0">
        {fallbackImage && !imgError ? (
          <Image
            src={fallbackImage}
            alt={title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
            {status === "loading" && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            )}
          </div>
        )}
      </div>

      {/* Layer 2: Iframe (invisible until loaded) */}
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
            ref={iframeRef}
            src={src}
            title={title}
            className={`h-full w-full border-0 ${iframeClassName}`}
            allow={allow}
            allowFullScreen={allowFullScreen}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      )}

      {/* Layer 3: Failed overlay */}
      {status === "failed" && fallbackUrl && (
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-colors hover:bg-black/50"
        >
          <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
            <ExternalLink className="h-3.5 w-3.5" />
            Open original
          </span>
        </a>
      )}
    </div>
  );
}
```

**Step 2: Run tests to verify they pass**

Run: `bun run test -- lib/__tests__/iframe-with-fallback.test.tsx`
Expected: All 8 tests PASS

**Step 3: Commit**

```bash
git add components/surface/shared/iframe-with-fallback.tsx lib/__tests__/iframe-with-fallback.test.tsx
git commit -m "feat: add IframeWithFallback component with OG image base layer"
```

---

### Task 3: Update Google Maps renderer

**Files:**
- Modify: `components/surface/renderers/google-maps-renderer.tsx`

**Step 1: Replace bare iframe with IframeWithFallback**

Replace the `embedUrl` branch (lines 33-42) — the `<div>` wrapping the `<iframe>` — with:

```tsx
<IframeWithFallback
  src={embedUrl}
  fallbackImage={space.imageUrl}
  fallbackUrl={space.originalUrl}
  title={space.title ?? "Map"}
  className="aspect-[16/10] w-full rounded-t-2xl"
  allowFullScreen
/>
```

Add import at top:
```tsx
import { IframeWithFallback } from "../shared/iframe-with-fallback";
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/surface/renderers/google-maps-renderer.tsx
git commit -m "feat: add iframe fallback to Google Maps renderer"
```

---

### Task 4: Update Spotify renderer

**Files:**
- Modify: `components/surface/renderers/spotify-renderer.tsx`

**Step 1: Replace bare iframe with IframeWithFallback**

Replace the `embedUrl` branch (lines 32-39) with:

```tsx
<IframeWithFallback
  src={embedUrl}
  fallbackImage={space.imageUrl}
  fallbackUrl={space.originalUrl}
  title={space.title ?? "Spotify"}
  className={`w-full rounded-t-2xl ${isCompact ? "h-[152px]" : "h-[352px]"}`}
  allow="encrypted-media"
/>
```

Add import at top:
```tsx
import { IframeWithFallback } from "../shared/iframe-with-fallback";
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/surface/renderers/spotify-renderer.tsx
git commit -m "feat: add iframe fallback to Spotify renderer"
```

---

### Task 5: Update YouTube renderer

**Files:**
- Modify: `components/surface/renderers/youtube-renderer.tsx`

**Step 1: Replace bare iframe in playing state with IframeWithFallback + revert on failure**

The YouTube renderer already uses thumbnail-first. When `playing && embedUrl` is true (lines 33-48), replace the bare iframe with `<IframeWithFallback>`. Add `onFailed` callback to revert `playing` to `false`.

Replace the `playing && embedUrl` branch with:

```tsx
<div className="relative aspect-video max-h-64 w-full overflow-hidden rounded-t-2xl bg-black">
  <IframeWithFallback
    src={embedUrl}
    fallbackImage={thumbnail}
    fallbackUrl={space.originalUrl}
    title={space.title ?? "Video"}
    className="h-full w-full"
    allow="autoplay; encrypted-media; picture-in-picture"
    allowFullScreen
    onFailed={() => setPlaying(false)}
  />
  {space.originalUrl && (
    <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
       className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80">
      <ExternalLink className="h-3.5 w-3.5 text-white" />
    </a>
  )}
</div>
```

Add import:
```tsx
import { IframeWithFallback } from "../shared/iframe-with-fallback";
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/surface/renderers/youtube-renderer.tsx
git commit -m "feat: add iframe fallback to YouTube renderer"
```

---

### Task 6: Update TikTok renderer

**Files:**
- Modify: `components/surface/renderers/tiktok-renderer.tsx`

**Step 1: Replace bare iframe in playing state with IframeWithFallback**

Replace the `playing && embedUrl` branch (lines 30-44) with:

```tsx
<div className="relative mx-auto w-full max-w-[325px] overflow-hidden rounded-2xl bg-black m-3 mb-0">
  <IframeWithFallback
    src={embedUrl}
    fallbackImage={thumbnail}
    fallbackUrl={space.originalUrl}
    title={space.title ?? "TikTok video"}
    className="h-[575px] w-full"
    allow="encrypted-media"
    allowFullScreen
    onFailed={() => setPlaying(false)}
  />
  {space.originalUrl && (
    <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
       className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80">
      <ExternalLink className="h-3.5 w-3.5 text-white" />
    </a>
  )}
</div>
```

Add import:
```tsx
import { IframeWithFallback } from "../shared/iframe-with-fallback";
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/surface/renderers/tiktok-renderer.tsx
git commit -m "feat: add iframe fallback to TikTok renderer"
```

---

### Task 7: Update Instagram renderer

**Files:**
- Modify: `components/surface/renderers/instagram-renderer.tsx`

**Step 1: Replace bare iframe in playing state with IframeWithFallback**

Replace the `playing && embedUrl` branch (lines 24-39) with:

```tsx
<div className="relative aspect-square max-h-64 w-full overflow-hidden rounded-t-2xl">
  <IframeWithFallback
    src={embedUrl}
    fallbackImage={thumbnail}
    fallbackUrl={space.originalUrl}
    title={space.title ?? "Instagram post"}
    className="h-full w-full"
    iframeClassName="bg-white"
    allow="encrypted-media"
    allowFullScreen
    onFailed={() => setPlaying(false)}
  />
  {space.originalUrl && (
    <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
       className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80">
      <ExternalLink className="h-3.5 w-3.5 text-white" />
    </a>
  )}
</div>
```

Add import:
```tsx
import { IframeWithFallback } from "../shared/iframe-with-fallback";
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/surface/renderers/instagram-renderer.tsx
git commit -m "feat: add iframe fallback to Instagram renderer"
```

---

### Task 8: Run full test suite and final verification

**Step 1: Run all tests**

Run: `bun run test`
Expected: All tests pass (existing 25 + 8 new = 33)

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build, no errors

**Step 3: Commit any remaining changes**

If any adjustments were needed, commit them.
