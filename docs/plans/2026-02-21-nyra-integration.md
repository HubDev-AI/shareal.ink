# Nyra Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Nyra (brand spirit guardian) into shareal.ink — homepage hero, surface page watermark, favicon, and subtle animations.

**Architecture:** Prepare 3 SVG asset versions from existing PNGs, create 2 React components (NyraHero, NyraSeal), integrate into homepage and surface pages, add favicon.

**Tech Stack:** Next.js 16 App Router, Motion (motion/react), SVG/PNG assets, Tailwind CSS 4

---

## Current State

### Source Images
- `images/Nyra.png` — Hero version (1.8MB PNG, white background, full body with face + tail + forehead lotus symbol)
- `images/NyraX3.png` — 3 versions on one canvas (Hero top, Icon bottom-left, Favicon bottom-right, purple-tinted background)

### Problems
1. Both PNGs have opaque backgrounds (white/purple) — need transparent backgrounds
2. Images are PNGs, not optimized for web (1.8MB each)
3. No SVG versions exist
4. Images aren't integrated into the app at all

---

## Asset Preparation (Manual — Before Code Tasks)

These steps require image editing. Use an image tool (Photoshop, Figma, or rembg CLI) to prepare assets.

### Step A: Remove backgrounds and extract 3 versions

From `images/Nyra.png`:
- Remove white background → save as `public/nyra/nyra-hero.png` (transparent)

From `images/NyraX3.png`:
- Crop the **top character** (full body with tail) → remove background → save as `public/nyra/nyra-hero.png` (use this if higher quality than Nyra.png)
- Crop the **bottom-left "Icon"** version → remove background → save as `public/nyra/nyra-icon.png`
- Crop the **bottom-right "Favicon"** version → remove background → save as `public/nyra/nyra-favicon.png`

### Step B: Optimize file sizes

Target sizes:
- `nyra-hero.png`: ~50-100KB (resize to max 512px width, compress with pngquant or tinypng)
- `nyra-icon.png`: ~10-20KB (resize to 128px width)
- `nyra-favicon.png`: ~5KB (resize to 64px width)

### Step C: Generate favicon files

From `nyra-favicon.png`, generate:
- `public/favicon.ico` (16x16 + 32x32 multi-size ICO)
- `public/nyra/nyra-favicon-32.png` (32x32)
- `public/nyra/nyra-favicon-16.png` (16x16)
- `public/apple-icon.png` (180x180 for Apple touch)

Tool: Use `sharp` or `favicons` npm package, or manual export from image editor.

### Step D: Folder structure after preparation

```
public/
  nyra/
    nyra-hero.png          ← ~80KB, transparent, 512px wide
    nyra-icon.png          ← ~15KB, transparent, 128px wide
    nyra-favicon.png       ← ~5KB, transparent, 64px wide
    nyra-favicon-32.png    ← 32x32
    nyra-favicon-16.png    ← 16x16
  favicon.ico              ← multi-size ICO
  apple-icon.png           ← 180x180
```

**Note:** We use PNGs (not SVGs) because Nyra's illustration has gradients, shading, and detail that don't convert well to SVG. Optimized PNGs at proper sizes are fine for web.

---

## Code Tasks

### Task 1: Create NyraHero Component

**Files:**
- Create: `components/nyra/nyra-hero.tsx`

**Implementation:**

```tsx
// components/nyra/nyra-hero.tsx
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
```

Key decisions:
- 192px (w-48) is the sweet spot — large enough to be the emotional anchor, small enough not to overpower the input
- Breathing animation: scale 1 → 1.02 → 1 over 4s, infinite
- `pointer-events-none select-none` — Nyra is not interactive
- No blinking animation in v1 (adds complexity for minimal gain — can add later with CSS keyframes on an overlay element)

**Step 1: Create the file**

Write the component above.

**Step 2: Commit**

```bash
git add components/nyra/nyra-hero.tsx
git commit -m "feat: NyraHero component with breathing animation"
```

---

### Task 2: Create NyraSeal Component

**Files:**
- Create: `components/nyra/nyra-seal.tsx`

**Implementation:**

```tsx
// components/nyra/nyra-seal.tsx
import Image from "next/image";

interface NyraSealProps {
  className?: string;
}

export function NyraSeal({ className }: NyraSealProps) {
  return (
    <div className={`pointer-events-none select-none ${className ?? ""}`}>
      <Image
        src="/nyra/nyra-icon.png"
        alt=""
        width={56}
        height={56}
        className="opacity-[0.15]"
      />
    </div>
  );
}
```

Key decisions:
- 56px (between 48-64px range from spec)
- `opacity-[0.15]` — watermark level, barely visible
- `alt=""` — decorative image, not meaningful for screen readers
- No animation — static seal on surface pages
- Not "use client" — this is a pure server component (no interactivity)

**Step 1: Create the file**

Write the component above.

**Step 2: Commit**

```bash
git add components/nyra/nyra-seal.tsx
git commit -m "feat: NyraSeal watermark component"
```

---

### Task 3: Integrate NyraHero on Homepage

**Files:**
- Modify: `app/page.tsx`

**Current layout:**
```
motto (top-left)
  shareal.ink (h1)
  subtitle
  CreateForm
```

**New layout:**
```
motto (top-left)
  NyraHero
  shareal.ink (h1)
  subtitle
  CreateForm
```

**Changes:**

Add import:
```tsx
import { NyraHero } from "@/components/nyra/nyra-hero";
```

Inside the `<div className="relative z-10 w-full max-w-lg space-y-8 text-center">`, add NyraHero as the first child, before the `<div className="space-y-3">`:

```tsx
<div className="flex justify-center">
  <NyraHero />
</div>
```

The existing `space-y-8` handles the 32px gap between Nyra and the title.

**Step 1: Make the edit**

**Step 2: Verify visually** — `bun run dev`, check homepage

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: Nyra hero on homepage"
```

---

### Task 4: Integrate NyraSeal on Surface Pages

**Files:**
- Modify: `app/[token]/page.tsx`

**Placement:** Bottom-right corner of the page, above footer, as a subtle watermark.

Add import:
```tsx
import { NyraSeal } from "@/components/nyra/nyra-seal";
```

Add the seal inside `<main>`, positioned fixed bottom-right. Place it after the `aurora-calm` div:

```tsx
<NyraSeal className="absolute bottom-6 right-6 z-10" />
```

**Step 1: Make the edit**

**Step 2: Verify visually** — check a surface page

**Step 3: Commit**

```bash
git add "app/[token]/page.tsx"
git commit -m "feat: Nyra seal watermark on surface pages"
```

---

### Task 5: Favicon + Metadata Integration

**Files:**
- Modify: `app/layout.tsx`

**Prerequisite:** Favicon files must exist in `public/` (from asset preparation above).

In `app/layout.tsx`, update the metadata export to include favicon references:

```tsx
export const metadata: Metadata = {
  title: "shareal.ink",
  description: "One link = One beautiful surface.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/nyra/nyra-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/nyra/nyra-favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};
```

**Step 1: Read current layout.tsx to see existing metadata**

**Step 2: Update the icons field**

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: Nyra favicon and apple-touch-icon"
```

---

### Task 6: Verify and PR

**Step 1: Run tests**

```bash
bun run test
```

Expected: All 46 tests pass (no test changes needed — these are purely visual additions).

**Step 2: Manual verification**

1. Homepage: Nyra centered above title, breathing animation visible, not too large
2. Surface page: Nyra seal barely visible bottom-right (~15% opacity)
3. Browser tab: Nyra favicon visible
4. Create a new surface: Nyra doesn't interfere with intent input or preview

**Step 3: Push and PR**

```bash
git push -u origin feat/nyra-integration
gh pr create --base dev --title "feat: Nyra brand integration — hero, seal, favicon" --body "$(cat <<'EOF'
## Summary
- NyraHero component with breathing animation on homepage
- NyraSeal watermark component on surface pages (15% opacity, bottom-right)
- Favicon and apple-touch-icon from Nyra assets
- Optimized PNG assets in public/nyra/

## Test plan
- [ ] Homepage: Nyra visible, breathing animation, not overpowering input
- [ ] Surface page: subtle watermark bottom-right
- [ ] Favicon visible in browser tab
- [ ] All 46 tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Design Decisions

### Why watermark outside the card, not inside

Nyra appears **outside** the surface card as a page-level watermark, not inside the card header.

Rationale:
- The card is the content stage — it belongs to the creator's link, not to the brand
- Putting Nyra inside the card makes her compete with content
- A subtle watermark says "this surface was created with shareal.ink" without interfering
- Consistent with the philosophy: "One link = One beautiful surface" — the surface is pure

### Why no blinking in v1

The blink animation requires either:
- A separate SVG layer for eyelids (complex, fragile)
- A CSS clip-path animation on the eyes area (needs precise coordinates)
- A canvas/WebGL approach (overkill)

The breathing animation alone makes Nyra feel alive. Blinking can be added in v2 once we have proper layered assets.

### Why PNGs not SVGs

Nyra's illustration has:
- Soft gradients and shading
- Fine fur detail
- Complex color transitions

These don't convert cleanly to SVG. Optimized PNGs at 512px / 128px / 64px are the right format — small file sizes, perfect rendering.

### Responsive sizing

- Hero: `w-48` (192px) on all screens — Nyra should feel the same size everywhere
- Seal: 56px — small enough to be a watermark on any screen size
- Favicon: standard 16/32px — browser-determined
