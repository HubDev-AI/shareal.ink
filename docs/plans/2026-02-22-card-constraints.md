# Card Size Constraints — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cap card heights by limiting images to max 256px and adding show more/less on titles across all renderers.

**Architecture:** Create a reusable `TruncatedText` component with overflow detection + CSS Grid height animation. Apply `max-h-64` to all image containers. Standardize description to `line-clamp-3`.

**Tech Stack:** React, Tailwind CSS (line-clamp, grid-template-rows), useRef/useEffect for overflow detection

---

### Task 1: Create TruncatedText component

**Files:**
- Create: `components/surface/shared/truncated-text.tsx`
- Create: `lib/__tests__/truncated-text.test.tsx`

**Step 1: Write the test**

```tsx
// lib/__tests__/truncated-text.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TruncatedText } from "@/components/surface/shared/truncated-text";

describe("TruncatedText", () => {
  it("renders text content", () => {
    render(<TruncatedText text="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders as a link when href is provided", () => {
    render(<TruncatedText text="Click me" href="https://example.com" />);
    const link = screen.getByRole("link", { name: "Click me" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not show toggle button for short text", () => {
    render(<TruncatedText text="Short" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test -- lib/__tests__/truncated-text.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the component**

```tsx
// components/surface/shared/truncated-text.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface TruncatedTextProps {
  text: string;
  href?: string | null;
  className?: string;
}

export function TruncatedText({ text, href, className = "" }: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  const baseClass = `text-[22px] font-semibold leading-tight tracking-tight text-white ${expanded ? "" : "line-clamp-2"} ${className}`;

  const content = href ? (
    <a
      ref={textRef as React.Ref<HTMLAnchorElement>}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} transition-colors hover:text-cyan-200`}
    >
      {text}
    </a>
  ) : (
    <span ref={textRef as React.Ref<HTMLSpanElement>} className={baseClass}>
      {text}
    </span>
  );

  return (
    <div>
      {content}
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-[13px] font-medium text-cyan-400/60 transition-colors hover:text-cyan-400"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test -- lib/__tests__/truncated-text.test.tsx`
Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add components/surface/shared/truncated-text.tsx lib/__tests__/truncated-text.test.tsx
git commit -m "feat: add TruncatedText component with show more/less"
```

---

### Task 2: Cap image heights in link type config

**Files:**
- Modify: `lib/config/link-types.ts`

No tests needed — this is a CSS config change verified visually.

**Step 1: Update imageHeight values**

In `lib/config/link-types.ts`, change these entries:

- `image.imageHeight`: `"max-h-96"` → `"max-h-64"`

All other types are already at or below 256px:
- `google_maps`: `"h-52"` (208px) — OK
- `youtube`: `"aspect-video"` — handled by renderer directly
- `instagram`: `"aspect-square"` — handled by renderer directly
- `tiktok`: `"aspect-[9/16]"` — handled by renderer directly
- `spotify`: `"h-20"` (80px) — OK
- `x_twitter`: `"h-52"` (208px) — OK
- `event`: `"h-52"` (208px) — OK
- `pdf`: `"h-32"` (128px) — OK
- `google_doc`: `"h-32"` (128px) — OK
- `generic`: `"h-52"` (208px) — OK

**Step 2: Commit**

```bash
git add lib/config/link-types.ts
git commit -m "fix: cap image link type height to max-h-64"
```

---

### Task 3: Update Instagram renderer

**Files:**
- Modify: `components/surface/renderers/instagram-renderer.tsx`

**Step 1: Apply changes**

Three changes in `instagram-renderer.tsx`:

1. Add import for TruncatedText:
```tsx
import { TruncatedText } from "../shared/truncated-text";
```

2. Cap thumbnail height — change line 40:
```tsx
// FROM:
<div className="group relative aspect-square max-h-96 w-full overflow-hidden rounded-t-2xl">
// TO:
<div className="group relative aspect-square max-h-64 w-full overflow-hidden rounded-t-2xl">
```

3. Also cap the embed playing state — change line 24:
```tsx
// FROM:
<div className="relative aspect-square max-h-[480px] w-full overflow-hidden rounded-t-2xl bg-white">
// TO:
<div className="relative aspect-square max-h-64 w-full overflow-hidden rounded-t-2xl bg-white">
```

4. Replace title block (lines 68-78) with TruncatedText:
```tsx
{space.title && (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}>
    <TruncatedText text={space.title} href={space.originalUrl} />
  </motion.div>
)}
```

5. Change description line-clamp from 4 to 3 (line 82):
```tsx
className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-3"
```

**Step 2: Commit**

```bash
git add components/surface/renderers/instagram-renderer.tsx
git commit -m "fix: cap Instagram card height, add title truncation"
```

---

### Task 4: Update YouTube renderer

**Files:**
- Modify: `components/surface/renderers/youtube-renderer.tsx`

**Step 1: Apply changes**

1. Add import:
```tsx
import { TruncatedText } from "../shared/truncated-text";
```

2. Cap thumbnail height — change line 49:
```tsx
// FROM:
<div className="group relative aspect-video max-h-80 w-full overflow-hidden rounded-t-2xl">
// TO:
<div className="group relative aspect-video max-h-64 w-full overflow-hidden rounded-t-2xl">
```

3. Also cap the embed playing state — change line 33:
```tsx
// FROM:
<div className="relative aspect-video max-h-80 w-full overflow-hidden rounded-t-2xl bg-black">
// TO:
<div className="relative aspect-video max-h-64 w-full overflow-hidden rounded-t-2xl bg-black">
```

4. Replace title block (lines 72-80) with TruncatedText:
```tsx
{space.title && (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}>
    <TruncatedText text={space.title} href={space.originalUrl} />
  </motion.div>
)}
```

**Step 2: Commit**

```bash
git add components/surface/renderers/youtube-renderer.tsx
git commit -m "fix: cap YouTube card height, add title truncation"
```

---

### Task 5: Update TikTok renderer

**Files:**
- Modify: `components/surface/renderers/tiktok-renderer.tsx`

**Step 1: Apply changes**

1. Add import:
```tsx
import { TruncatedText } from "../shared/truncated-text";
```

2. Cap thumbnail height — change line 45:
```tsx
// FROM:
<div className="group relative aspect-[9/16] max-h-96 w-full overflow-hidden rounded-2xl ring-2 ring-[#69C9D0]/50 m-3 mb-0">
// TO:
<div className="group relative aspect-[9/16] max-h-64 w-full overflow-hidden rounded-2xl ring-2 ring-[#69C9D0]/50 m-3 mb-0">
```

3. Replace title block (lines 79-88) with TruncatedText:
```tsx
{space.title && (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}>
    <TruncatedText text={space.title} href={space.originalUrl} />
  </motion.div>
)}
```

**Step 2: Commit**

```bash
git add components/surface/renderers/tiktok-renderer.tsx
git commit -m "fix: cap TikTok card height, add title truncation"
```

---

### Task 6: Update Generic renderer

**Files:**
- Modify: `components/surface/renderers/generic-renderer.tsx`

**Step 1: Apply changes**

1. Add import:
```tsx
import { TruncatedText } from "../shared/truncated-text";
```

2. Replace title block for the non-text-only case (the `else` branch, lines 30-40) with TruncatedText.

The text-only case (hero display with large gradient text for short titles) should keep its existing behavior — TruncatedText only applies when there's an image/link above.

Replace the `!isTextOnly` title rendering:
```tsx
{space.title && !isTextOnly && (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}>
    <TruncatedText text={space.title} href={space.originalUrl} />
  </motion.div>
)}
```

Keep the `isTextOnly` title rendering as-is (it already has special styling for text-only surfaces).

3. Change description `line-clamp-4` to `line-clamp-3`:
```tsx
className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-3"
```

**Step 2: Commit**

```bash
git add components/surface/renderers/generic-renderer.tsx
git commit -m "fix: add title truncation to generic renderer"
```

---

### Task 7: Update remaining renderers (Google Maps, Spotify, Google Doc, Image, PDF)

**Files:**
- Modify: `components/surface/renderers/google-maps-renderer.tsx`
- Modify: `components/surface/renderers/spotify-renderer.tsx`
- Modify: `components/surface/renderers/google-doc-renderer.tsx`
- Modify: `components/surface/renderers/image-renderer.tsx`
- Modify: `components/surface/renderers/pdf-renderer.tsx`

**Step 1: Apply the same pattern to each**

For each file:

1. Add import:
```tsx
import { TruncatedText } from "../shared/truncated-text";
```

2. Replace the title `<motion.h1>` block with:
```tsx
{space.title && (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}>
    <TruncatedText text={space.title} href={space.originalUrl} />
  </motion.div>
)}
```

3. Change any description `line-clamp-4` to `line-clamp-3`.

**Specific notes:**
- `image-renderer.tsx`: Also change `max-h-96` to `max-h-64` on the image container (line 16) AND the `max-h-96` on the `<Image>` className (line 22).
- `x-twitter-renderer.tsx`: **Skip** — Twitter uses embedded tweets with its own sizing. Title/description only show when there's no tweet URL, and the Twitter widget handles its own truncation.
- `google-maps-renderer.tsx`: description `line-clamp-4` → `line-clamp-3`
- `google-doc-renderer.tsx`: description `line-clamp-4` → `line-clamp-3`
- `pdf-renderer.tsx`: description `line-clamp-4` → `line-clamp-3`
- `image-renderer.tsx`: description `line-clamp-4` → `line-clamp-3`
- `spotify-renderer.tsx`: already `line-clamp-3` — no change needed

**Step 2: Commit**

```bash
git add components/surface/renderers/google-maps-renderer.tsx components/surface/renderers/spotify-renderer.tsx components/surface/renderers/google-doc-renderer.tsx components/surface/renderers/image-renderer.tsx components/surface/renderers/pdf-renderer.tsx
git commit -m "fix: add title truncation to remaining renderers, standardize line-clamp-3"
```

---

### Task 8: Verify build + tests

**Step 1: Run tests**

```bash
bun run test
```

Expected: All tests pass (existing 56 + 3 new = 59).

**Step 2: Run build**

```bash
bun run build
```

Expected: Build succeeds.

**Step 3: Manual verification**

Start dev server and test with:
- An Instagram link (long caption) — image should be capped, title should show "Show more"
- A YouTube link — image capped at 256px
- A generic link with long OG title — truncated at 2 lines with "Show more"

```bash
bun run dev
```
