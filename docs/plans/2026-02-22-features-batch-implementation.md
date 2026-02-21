# Features Batch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 7 post-MVP features: short tokens, document/image link types, Plausible analytics, QR codes, Redis rate limiting, platform-flavored previews, and E2E Playwright tests.

**Architecture:** Each feature is a self-contained branch. The adapter pattern (`lib/interfaces/` + `lib/adapters/` + `lib/container.ts`) is used for analytics and rate limiting swaps. New link types follow the existing renderer registry pattern (`components/surface/renderers/`). A new preview renderer registry mirrors it for homepage previews (`components/create/preview-renderers/`).

**Tech Stack:** Next.js 16, TypeScript 5.9, Prisma 7, Tailwind 4, Motion 12, `qrcode`, `@upstash/ratelimit`, `@playwright/test`. Package manager: bun.

**Design doc:** `docs/plans/2026-02-22-features-batch-design.md`

---

## Feature 1: Short Tokens (22-char → 7-char)

### Task 1.1: Update token generation + tests

**Files:**
- Modify: `lib/tokens.ts`
- Modify: `lib/__tests__/tokens.test.ts`

**Step 1: Update the test to expect 7 characters**

In `lib/__tests__/tokens.test.ts`, change the first test:

```ts
it("returns a 7-character string", () => {
  const token = createSpaceToken();
  expect(token).toHaveLength(7);
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — `Expected length: 7, Received length: 22`

**Step 3: Update token generation**

In `lib/tokens.ts`, change `customAlphabet(BASE62, 22)` to `customAlphabet(BASE62, 7)`:

```ts
const generateToken = customAlphabet(BASE62, 7);
```

**Step 4: Run test to verify it passes**

Run: `bun run test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/tokens.ts lib/__tests__/tokens.test.ts
git commit -m "feat: shorten space tokens from 22 to 7 characters"
```

### Task 1.2: Update Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration file via Prisma

**Step 1: Update schema**

In `prisma/schema.prisma`, change the token column on the Space model:

```prisma
token  String  @unique @db.VarChar(7)
```

(was `@db.VarChar(22)`)

**Step 2: Generate migration**

Run: `bunx prisma migrate dev --name shorten-token-to-7`

This will:
- Generate the migration SQL (`ALTER COLUMN token TYPE VARCHAR(7)`)
- Apply it to the local database
- Regenerate the Prisma client

**Step 3: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add prisma/
git commit -m "migration: shorten token column to VARCHAR(7)"
```

### Task 1.3: Add collision retry in space creation

**Files:**
- Modify: `app/api/spaces/route.ts:43-60`

**Step 1: Wrap space creation with retry on unique violation**

Replace the simple `createSpaceToken()` + `prisma.space.create()` block (lines 43-60) with a retry loop:

```ts
  let space;
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = createSpaceToken();
    try {
      space = await prisma.space.create({
        data: {
          token,
          originalUrl: url || null,
          title: ogTitle || null,
          description: ogDescription || null,
          imageUrl: ogImageUrl,
          linkType,
          primaryActionLabel,
          intentType: intentType || "meet",
          intentText: intentText || null,
          extras: ogExtras ?? undefined,
          ogJobId: jobId || null,
          creatorUserId: user.isAuthenticated ? user.userId : null,
        },
      });
      break;
    } catch (e: unknown) {
      if (attempt === 2 || !(e instanceof Error) || !e.message.includes("Unique constraint")) {
        throw e;
      }
    }
  }

  if (!space) {
    return NextResponse.json({ error: "Failed to generate unique token" }, { status: 500 });
  }
```

**Step 2: Verify build + tests**

Run: `bun run build && bun run test`
Expected: All pass

**Step 3: Commit**

```bash
git add app/api/spaces/route.ts
git commit -m "feat: add collision retry for token generation"
```

---

## Feature 2: Document & Image Link Types

### Task 2.1: Add new LinkType enum values

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/types.ts`
- Modify: `lib/config/link-types.ts`

**Step 1: Add enum values to Prisma schema**

In `prisma/schema.prisma`, add to the `LinkType` enum:

```prisma
enum LinkType {
  google_maps
  youtube
  instagram
  tiktok
  spotify
  x_twitter
  event
  pdf
  google_doc
  image
  generic
}
```

**Step 2: Update TypeScript type**

In `lib/types.ts`, update the `LinkType` union:

```ts
export type LinkType = "google_maps" | "youtube" | "instagram" | "tiktok" | "spotify" | "x_twitter" | "event" | "pdf" | "google_doc" | "image" | "generic";
```

**Step 3: Add config entries**

In `lib/config/link-types.ts`, add entries before the closing of the `linkTypeConfig` record (before the `generic` entry):

```ts
  pdf: {
    label: "PDF",
    imageHeight: "h-32",
    imageOverlay: false,
    actionLabel: "Open PDF",
    badge: { bg: "bg-red-100", text: "text-red-700" },
    intentPlaceholder: "Check this document",
    defaultIntentType: "share",
  },
  google_doc: {
    label: "Google Doc",
    imageHeight: "h-32",
    imageOverlay: false,
    actionLabel: "Open Document",
    badge: { bg: "bg-blue-100", text: "text-blue-700" },
    intentPlaceholder: "Take a look at this",
    defaultIntentType: "share",
  },
  image: {
    label: "Image",
    imageHeight: "max-h-96",
    imageOverlay: false,
    actionLabel: "View Image",
    badge: { bg: "bg-violet-100", text: "text-violet-700" },
    intentPlaceholder: "Check this out",
    defaultIntentType: "share",
  },
```

**Step 4: Generate migration**

Run: `bunx prisma migrate dev --name add-pdf-google-doc-image-link-types`

**Step 5: Verify build**

Run: `bun run build`

**Step 6: Commit**

```bash
git add prisma/ lib/types.ts lib/config/link-types.ts
git commit -m "feat: add pdf, google_doc, image link types"
```

### Task 2.2: Add detection rules + tests

**Files:**
- Modify: `lib/adapters/regex-link-detector.ts`
- Modify: `lib/__tests__/regex-link-detector.test.ts`

**Step 1: Write failing tests**

Add to `lib/__tests__/regex-link-detector.test.ts`:

```ts
  // PDF detection
  it("detects .pdf URL as pdf", () => {
    const result = detector.detect("https://example.com/report.pdf");
    expect(result.linkType).toBe("pdf");
    expect(result.suggestedActionLabel).toBe("Open PDF");
  });

  it("detects .pdf URL with query params as pdf", () => {
    const result = detector.detect("https://example.com/report.pdf?dl=1");
    expect(result.linkType).toBe("pdf");
  });

  // Google Docs detection
  it("detects Google Docs as google_doc", () => {
    const result = detector.detect("https://docs.google.com/document/d/abc123/edit");
    expect(result.linkType).toBe("google_doc");
    expect(result.suggestedActionLabel).toBe("Open Document");
  });

  it("detects Google Sheets as google_doc", () => {
    const result = detector.detect("https://sheets.google.com/spreadsheets/d/abc123");
    expect(result.linkType).toBe("google_doc");
  });

  it("detects Google Slides as google_doc", () => {
    const result = detector.detect("https://slides.google.com/presentation/d/abc123");
    expect(result.linkType).toBe("google_doc");
  });

  it("detects Google Drive as google_doc", () => {
    const result = detector.detect("https://drive.google.com/file/d/abc123/view");
    expect(result.linkType).toBe("google_doc");
  });

  // Image detection
  it("detects .jpg URL as image", () => {
    const result = detector.detect("https://example.com/photo.jpg");
    expect(result.linkType).toBe("image");
    expect(result.suggestedActionLabel).toBe("View Image");
  });

  it("detects .png URL as image", () => {
    const result = detector.detect("https://example.com/screenshot.png");
    expect(result.linkType).toBe("image");
  });

  it("detects .webp URL with query as image", () => {
    const result = detector.detect("https://cdn.example.com/img.webp?w=800");
    expect(result.linkType).toBe("image");
  });

  // Edge: YouTube thumbnail .jpg should NOT match image (YouTube rule is first)
  it("detects YouTube thumbnail URL as youtube, not image", () => {
    const result = detector.detect("https://youtube.com/vi/abc123/maxresdefault.jpg");
    expect(result.linkType).toBe("youtube");
  });
```

**Step 2: Run tests to verify they fail**

Run: `bun run test`
Expected: FAIL — new link types not recognized

**Step 3: Add detection rules**

In `lib/adapters/regex-link-detector.ts`, add these rules to the `RULES` array. Place them **after** all platform-specific rules but **before** the end of the array (the array has no `generic` entry — it's the fallback):

```ts
  // Documents — PDF
  { pattern: /\.pdf(\?|$)/i, linkType: "pdf" },

  // Documents — Google Docs/Sheets/Slides/Drive
  { pattern: /(docs|sheets|slides|drive)\.google\.com/i, linkType: "google_doc" },

  // Images — direct image URLs
  { pattern: /\.(jpe?g|png|gif|webp|svg)(\?|$)/i, linkType: "image" },
```

**Step 4: Run tests to verify they pass**

Run: `bun run test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/adapters/regex-link-detector.ts lib/__tests__/regex-link-detector.test.ts
git commit -m "feat: detect pdf, google_doc, image link types"
```

### Task 2.3: Surface renderers for new link types

**Files:**
- Create: `components/surface/renderers/pdf-renderer.tsx`
- Create: `components/surface/renderers/google-doc-renderer.tsx`
- Create: `components/surface/renderers/image-renderer.tsx`
- Modify: `components/surface/renderers/index.ts`

**Step 1: Create PdfRenderer**

```tsx
// components/surface/renderers/pdf-renderer.tsx
"use client";

import { motion } from "motion/react";
import { FileText, ExternalLink } from "lucide-react";
import type { RendererProps } from "./renderer-props";

export function PdfRenderer({ space }: RendererProps) {
  return (
    <>
      <a
        href={space.originalUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-36 w-full items-center justify-center gap-4 rounded-t-2xl bg-gradient-to-br from-red-500/10 to-red-700/10 transition-colors hover:from-red-500/15 hover:to-red-700/15"
      >
        <FileText className="h-12 w-12 text-red-400/70 transition-colors group-hover:text-red-400" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-white/60 group-hover:text-white/80">PDF Document</span>
          <span className="flex items-center gap-1 text-xs text-white/30">
            <ExternalLink className="h-3 w-3" /> Open
          </span>
        </div>
      </a>

      <div className="px-6 pt-5">
        {space.title && (
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.15, duration: 0.3 }}
                     className="text-[22px] font-semibold leading-tight tracking-tight text-white">
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : space.title}
          </motion.h1>
        )}
        {space.description && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-3">
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
```

**Step 2: Create GoogleDocRenderer**

```tsx
// components/surface/renderers/google-doc-renderer.tsx
"use client";

import { motion } from "motion/react";
import { FileSpreadsheet, FileText, Presentation, ExternalLink } from "lucide-react";
import type { RendererProps } from "./renderer-props";

function getDocTypeInfo(url: string | null) {
  if (!url) return { icon: FileText, label: "Google Doc", gradient: "from-blue-500/10 to-blue-700/10" };
  if (url.includes("sheets.google.com")) return { icon: FileSpreadsheet, label: "Google Sheets", gradient: "from-green-500/10 to-green-700/10" };
  if (url.includes("slides.google.com")) return { icon: Presentation, label: "Google Slides", gradient: "from-yellow-500/10 to-yellow-700/10" };
  return { icon: FileText, label: "Google Docs", gradient: "from-blue-500/10 to-blue-700/10" };
}

export function GoogleDocRenderer({ space }: RendererProps) {
  const { icon: Icon, label, gradient } = getDocTypeInfo(space.originalUrl);

  return (
    <>
      <a
        href={space.originalUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex h-36 w-full items-center justify-center gap-4 rounded-t-2xl bg-gradient-to-br ${gradient} transition-colors hover:brightness-125`}
      >
        <Icon className="h-12 w-12 text-blue-400/70 transition-colors group-hover:text-blue-400" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-white/60 group-hover:text-white/80">{label}</span>
          <span className="flex items-center gap-1 text-xs text-white/30">
            <ExternalLink className="h-3 w-3" /> Open
          </span>
        </div>
      </a>

      <div className="px-6 pt-5">
        {space.title && (
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.15, duration: 0.3 }}
                     className="text-[22px] font-semibold leading-tight tracking-tight text-white">
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : space.title}
          </motion.h1>
        )}
        {space.description && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-3">
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
```

**Step 3: Create ImageRenderer**

```tsx
// components/surface/renderers/image-renderer.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import type { RendererProps } from "./renderer-props";

export function ImageRenderer({ space }: RendererProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = space.originalUrl ?? space.imageUrl;

  return (
    <>
      {imageUrl && !imgError ? (
        <div className="group relative max-h-96 w-full overflow-hidden rounded-t-2xl bg-black/20">
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Image
              src={imageUrl}
              alt={space.title ?? "Shared image"}
              width={720}
              height={480}
              className="w-full object-contain"
              onError={() => setImgError(true)}
              unoptimized
              priority
            />
            <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </div>
          </a>
        </div>
      ) : null}

      <div className="px-6 pt-5">
        {space.title && (
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.15, duration: 0.3 }}
                     className="text-[22px] font-semibold leading-tight tracking-tight text-white">
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : space.title}
          </motion.h1>
        )}
        {space.description && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-3">
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
```

**Step 4: Register in renderer index**

Update `components/surface/renderers/index.ts` — add imports and registry entries:

```ts
import { PdfRenderer } from "./pdf-renderer";
import { GoogleDocRenderer } from "./google-doc-renderer";
import { ImageRenderer } from "./image-renderer";

// In the registry object, add:
  pdf: PdfRenderer,
  google_doc: GoogleDocRenderer,
  image: ImageRenderer,
```

**Step 5: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/surface/renderers/
git commit -m "feat: surface renderers for pdf, google_doc, image link types"
```

---

## Feature 3: Platform-Flavored Previews

### Task 3.1: Create preview renderer registry

**Files:**
- Create: `components/create/preview-renderers/index.ts`
- Create: `components/create/preview-renderers/preview-renderer-props.ts`
- Create: `components/create/preview-renderers/generic-preview.tsx`

**Step 1: Create PreviewRendererProps interface**

```ts
// components/create/preview-renderers/preview-renderer-props.ts
import type { LinkType, OgMetadata } from "@/lib/types";

export interface PreviewRendererProps {
  linkType: LinkType;
  metadata: OgMetadata | null;
  loading: boolean;
  title: string | null;
  originalUrl: string | null;
}
```

**Step 2: Create GenericPreview**

Refactor the current `LinkPreview` body into `GenericPreview`. This is essentially the existing `LinkPreview` component but as a renderer:

```tsx
// components/create/preview-renderers/generic-preview.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function GenericPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
      {loading && !imageUrl ? (
        <Skeleton className="h-40 w-full rounded-none" />
      ) : imageUrl && !imageError ? (
        <div className="relative h-40 w-full">
          <Image src={imageUrl} alt={displayTitle ?? "Preview"} fill
                 className="object-cover" onError={() => setImageError(true)} unoptimized />
        </div>
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <TypeBadge linkType={linkType} />
        </div>
        {loading && !displayTitle ? (
          <>
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            {displayTitle && <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>}
            {displayDescription && <p className="text-sm text-muted line-clamp-2">{displayDescription}</p>}
          </>
        )}
      </div>
    </>
  );
}
```

**Step 3: Create registry index**

```ts
// components/create/preview-renderers/index.ts
import type { ComponentType } from "react";
import type { PreviewRendererProps } from "./preview-renderer-props";
import type { LinkType } from "@/lib/types";
import { GenericPreview } from "./generic-preview";

const registry: Partial<Record<LinkType, ComponentType<PreviewRendererProps>>> = {};

export function getPreviewRenderer(linkType: LinkType): ComponentType<PreviewRendererProps> {
  return registry[linkType] ?? GenericPreview;
}
```

**Step 4: Update LinkPreview to use the registry**

In `components/create/link-preview.tsx`, replace the component body to delegate to the registry:

```tsx
"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { getPreviewRenderer } from "./preview-renderers";
import type { LinkType, OgMetadata } from "@/lib/types";

interface LinkPreviewProps {
  linkType: LinkType;
  metadata: OgMetadata | null;
  loading: boolean;
  title: string | null;
  originalUrl?: string | null;
  className?: string;
}

export function LinkPreview({ linkType, metadata, loading, title, originalUrl, className }: LinkPreviewProps) {
  const Renderer = getPreviewRenderer(linkType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm", className)}
    >
      <Renderer
        linkType={linkType}
        metadata={metadata}
        loading={loading}
        title={title}
        originalUrl={originalUrl ?? null}
      />
    </motion.div>
  );
}
```

**Step 5: Thread `originalUrl` through from CreateForm**

In `components/create/create-form.tsx`, update the `LinkPreview` usage (around line 254) to pass `originalUrl`:

```tsx
<LinkPreview
  linkType={linkType}
  metadata={metadata}
  loading={state === "fetching"}
  title={freeTextTitle}
  originalUrl={freeTextTitle ? null : input.trim()}
  className="border-white/15 bg-white/8 text-white backdrop-blur-md [&_h3]:text-white [&_p]:text-white/60"
/>
```

**Step 6: Verify build**

Run: `bun run build`

**Step 7: Commit**

```bash
git add components/create/preview-renderers/ components/create/link-preview.tsx components/create/create-form.tsx
git commit -m "feat: preview renderer registry with generic fallback"
```

### Task 3.2: Create per-platform preview renderers

**Files:**
- Create: `components/create/preview-renderers/youtube-preview.tsx`
- Create: `components/create/preview-renderers/spotify-preview.tsx`
- Create: `components/create/preview-renderers/instagram-preview.tsx`
- Create: `components/create/preview-renderers/tiktok-preview.tsx`
- Create: `components/create/preview-renderers/google-maps-preview.tsx`
- Create: `components/create/preview-renderers/x-twitter-preview.tsx`
- Create: `components/create/preview-renderers/pdf-preview.tsx`
- Create: `components/create/preview-renderers/google-doc-preview.tsx`
- Create: `components/create/preview-renderers/image-preview.tsx`
- Modify: `components/create/preview-renderers/index.ts`

Each preview renderer is a compact version of its surface counterpart, showing the signature visual element. All share the same `PreviewRendererProps` interface.

**Step 1: Create YouTubePreview**

```tsx
// components/create/preview-renderers/youtube-preview.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function YouTubePreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const [imgError, setImgError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageUrl = metadata?.imageUrl;

  // Try to extract YouTube thumbnail from URL
  let thumbnail = imageUrl;
  if (!thumbnail && originalUrl) {
    try {
      const u = new URL(originalUrl);
      let videoId: string | null = null;
      if (u.hostname === "youtu.be") videoId = u.pathname.slice(1).split("/")[0] || null;
      else videoId = u.searchParams.get("v") ?? u.pathname.match(/\/(shorts|embed|live|v)\/([^/?]+)/)?.[2] ?? null;
      if (videoId) thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    } catch { /* ignore */ }
  }

  return (
    <>
      {loading && !thumbnail ? (
        <Skeleton className="aspect-video w-full rounded-none" />
      ) : thumbnail && !imgError ? (
        <div className="group relative aspect-video w-full overflow-hidden">
          <Image src={thumbnail} alt={displayTitle ?? "Video"} fill
                 className="object-cover" onError={() => setImgError(true)} unoptimized />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-lg">
              <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
            </div>
          </div>
        </div>
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <><Skeleton className="mb-2 h-5 w-3/4" /><Skeleton className="h-4 w-full" /></>
        ) : (
          <>
            {displayTitle && <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>}
            {metadata?.description && <p className="text-sm text-muted line-clamp-2">{metadata.description}</p>}
          </>
        )}
      </div>
    </>
  );
}
```

**Step 2: Create SpotifyPreview**

```tsx
// components/create/preview-renderers/spotify-preview.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

function getSpotifyEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== "open.spotify.com") return null;
    const m = u.pathname.match(/^\/(track|album|playlist|episode)\/([^/?]+)/);
    if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
  } catch { /* ignore */ }
  return null;
}

export function SpotifyPreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;
  const embedUrl = getSpotifyEmbedUrl(originalUrl);

  return (
    <>
      {loading ? (
        <Skeleton className="h-[152px] w-full rounded-none" />
      ) : embedUrl ? (
        <iframe src={embedUrl} title={displayTitle ?? "Spotify"} className="h-[152px] w-full border-0" allow="encrypted-media" loading="lazy" />
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <Skeleton className="h-5 w-3/4" />
        ) : displayTitle ? (
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>
        ) : null}
      </div>
    </>
  );
}
```

**Step 3: Create InstagramPreview**

```tsx
// components/create/preview-renderers/instagram-preview.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Instagram } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function InstagramPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const [imgError, setImgError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
      {loading && !imageUrl ? (
        <Skeleton className="aspect-square max-h-64 w-full rounded-none" />
      ) : imageUrl && !imgError ? (
        <div className="group relative aspect-square max-h-64 w-full overflow-hidden">
          <Image src={imageUrl} alt={displayTitle ?? "Instagram"} fill
                 className="object-cover" onError={() => setImgError(true)} unoptimized />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg">
              <Instagram className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <Skeleton className="h-5 w-3/4" />
        ) : displayTitle ? (
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>
        ) : null}
      </div>
    </>
  );
}
```

**Step 4: Create TikTokPreview**

```tsx
// components/create/preview-renderers/tiktok-preview.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function TikTokPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const [imgError, setImgError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
      {loading && !imageUrl ? (
        <Skeleton className="aspect-[9/16] max-h-48 w-full rounded-none" />
      ) : imageUrl && !imgError ? (
        <div className="group relative mx-auto aspect-[9/16] max-h-48 w-auto overflow-hidden">
          <Image src={imageUrl} alt={displayTitle ?? "TikTok"} fill
                 className="object-cover" onError={() => setImgError(true)} unoptimized />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
            </div>
          </div>
        </div>
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <Skeleton className="h-5 w-3/4" />
        ) : displayTitle ? (
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>
        ) : null}
      </div>
    </>
  );
}
```

**Step 5: Create GoogleMapsPreview**

```tsx
// components/create/preview-renderers/google-maps-preview.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

function getMiniMapUrl(url: string | null): string | null {
  if (!url) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
}

export function GoogleMapsPreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;
  const embedUrl = getMiniMapUrl(originalUrl);

  return (
    <>
      {loading ? (
        <Skeleton className="h-[200px] w-full rounded-none" />
      ) : embedUrl ? (
        <iframe src={embedUrl} title={displayTitle ?? "Map"} className="h-[200px] w-full border-0"
                loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <Skeleton className="h-5 w-3/4" />
        ) : displayTitle ? (
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>
        ) : null}
      </div>
    </>
  );
}
```

**Step 6: Create XTwitterPreview**

```tsx
// components/create/preview-renderers/x-twitter-preview.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function XTwitterPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const [imgError, setImgError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageUrl = metadata?.imageUrl;

  return (
    <>
      {loading && !imageUrl ? (
        <Skeleton className="h-32 w-full rounded-none" />
      ) : imageUrl && !imgError ? (
        <div className="relative h-32 w-full overflow-hidden">
          <Image src={imageUrl} alt={displayTitle ?? "Post"} fill
                 className="object-cover" onError={() => setImgError(true)} unoptimized />
        </div>
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <><Skeleton className="mb-2 h-5 w-3/4" /><Skeleton className="h-4 w-full" /></>
        ) : (
          <>
            {displayTitle && <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>}
            {metadata?.description && <p className="text-sm text-muted line-clamp-2">{metadata.description}</p>}
          </>
        )}
      </div>
    </>
  );
}
```

**Step 7: Create PdfPreview**

```tsx
// components/create/preview-renderers/pdf-preview.tsx
"use client";

import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function PdfPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;

  return (
    <>
      <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-red-500/10 to-red-700/10">
        <FileText className="h-10 w-10 text-red-400/60" />
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <Skeleton className="h-5 w-3/4" />
        ) : displayTitle ? (
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>
        ) : null}
      </div>
    </>
  );
}
```

**Step 8: Create GoogleDocPreview**

```tsx
// components/create/preview-renderers/google-doc-preview.tsx
"use client";

import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function GoogleDocPreview({ linkType, metadata, loading, title }: PreviewRendererProps) {
  const displayTitle = metadata?.title ?? title;

  return (
    <>
      <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-700/10">
        <FileText className="h-10 w-10 text-blue-400/60" />
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <Skeleton className="h-5 w-3/4" />
        ) : displayTitle ? (
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>
        ) : null}
      </div>
    </>
  );
}
```

**Step 9: Create ImagePreview**

```tsx
// components/create/preview-renderers/image-preview.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { PreviewRendererProps } from "./preview-renderer-props";

export function ImagePreview({ linkType, metadata, loading, title, originalUrl }: PreviewRendererProps) {
  const [imgError, setImgError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const imageUrl = originalUrl ?? metadata?.imageUrl;

  return (
    <>
      {loading && !imageUrl ? (
        <Skeleton className="h-48 w-full rounded-none" />
      ) : imageUrl && !imgError ? (
        <div className="relative max-h-48 w-full overflow-hidden bg-black/10">
          <Image src={imageUrl} alt={displayTitle ?? "Image"} width={480} height={320}
                 className="w-full object-contain" onError={() => setImgError(true)} unoptimized />
        </div>
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2"><TypeBadge linkType={linkType} /></div>
        {loading && !displayTitle ? (
          <Skeleton className="h-5 w-3/4" />
        ) : displayTitle ? (
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{displayTitle}</h3>
        ) : null}
      </div>
    </>
  );
}
```

**Step 10: Register all preview renderers**

Update `components/create/preview-renderers/index.ts`:

```ts
import type { ComponentType } from "react";
import type { PreviewRendererProps } from "./preview-renderer-props";
import type { LinkType } from "@/lib/types";
import { GenericPreview } from "./generic-preview";
import { YouTubePreview } from "./youtube-preview";
import { SpotifyPreview } from "./spotify-preview";
import { InstagramPreview } from "./instagram-preview";
import { TikTokPreview } from "./tiktok-preview";
import { GoogleMapsPreview } from "./google-maps-preview";
import { XTwitterPreview } from "./x-twitter-preview";
import { PdfPreview } from "./pdf-preview";
import { GoogleDocPreview } from "./google-doc-preview";
import { ImagePreview } from "./image-preview";

const registry: Partial<Record<LinkType, ComponentType<PreviewRendererProps>>> = {
  youtube: YouTubePreview,
  spotify: SpotifyPreview,
  instagram: InstagramPreview,
  tiktok: TikTokPreview,
  google_maps: GoogleMapsPreview,
  x_twitter: XTwitterPreview,
  pdf: PdfPreview,
  google_doc: GoogleDocPreview,
  image: ImagePreview,
};

export function getPreviewRenderer(linkType: LinkType): ComponentType<PreviewRendererProps> {
  return registry[linkType] ?? GenericPreview;
}
```

**Step 11: Verify build**

Run: `bun run build`

**Step 12: Commit**

```bash
git add components/create/preview-renderers/
git commit -m "feat: per-platform preview renderers for create flow"
```

### Task 3.3: Platform accent colors on surface renderers

**Files:**
- Modify: `components/surface/renderers/youtube-renderer.tsx`
- Modify: `components/surface/renderers/instagram-renderer.tsx`
- Modify: `components/surface/renderers/tiktok-renderer.tsx`

**Step 1: YouTube — red play button**

In `components/surface/renderers/youtube-renderer.tsx`, change the play button circle (line 56-57) from `bg-white/90` to `bg-red-600`:

```tsx
<div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
  <Play className="ml-1 h-6 w-6 fill-white text-white" />
</div>
```

**Step 2: Instagram — gradient icon circle**

In `components/surface/renderers/instagram-renderer.tsx`, change the icon circle (line 47-49) from `bg-white/90` to Instagram gradient:

```tsx
<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
  <Instagram className="h-6 w-6 text-white" />
</div>
```

**Step 3: TikTok — accent play button**

In `components/surface/renderers/tiktok-renderer.tsx`, change the play button (line 51-53) from `bg-white/90` + dark icon to TikTok style:

```tsx
<div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
  <Play className="ml-1 h-6 w-6 fill-[#010101] text-[#010101]" />
</div>
```

And add a subtle TikTok-colored ring:

```tsx
<div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-[#69C9D0]/50 backdrop-blur-sm transition-transform group-hover:scale-110">
```

**Step 4: Verify build**

Run: `bun run build`

**Step 5: Commit**

```bash
git add components/surface/renderers/youtube-renderer.tsx components/surface/renderers/instagram-renderer.tsx components/surface/renderers/tiktok-renderer.tsx
git commit -m "feat: platform accent colors on surface renderers"
```

---

## Feature 4: Redis Rate Limiting

### Task 4.1: Install Upstash packages

**Step 1: Install**

Run: `bun add @upstash/ratelimit @upstash/redis`

**Step 2: Commit**

```bash
git add package.json bun.lock
git commit -m "deps: add @upstash/ratelimit and @upstash/redis"
```

### Task 4.2: Create UpstashRateLimiter adapter

**Files:**
- Create: `lib/adapters/upstash-rate-limiter.ts`
- Modify: `lib/container.ts:2,14`

**Step 1: Create the adapter**

```ts
// lib/adapters/upstash-rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { IRateLimiter, RateLimitResult } from "@/lib/interfaces";

export class UpstashRateLimiter implements IRateLimiter {
  private defaultLimiter: Ratelimit;
  private respondLimiter: Ratelimit;

  constructor() {
    const redis = Redis.fromEnv();
    this.defaultLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "rl",
    });
    this.respondLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      prefix: "rl:respond",
    });
  }

  async check(key: string): Promise<RateLimitResult> {
    const limiter = key.startsWith("respond:") ? this.respondLimiter : this.defaultLimiter;
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }
}
```

**Step 2: Update container.ts to conditionally use Upstash**

In `lib/container.ts`, add the import and swap the rate limiter:

```ts
import { UpstashRateLimiter } from "@/lib/adapters/upstash-rate-limiter";

// Replace line 14:
export const rateLimiter: IRateLimiter = process.env.UPSTASH_REDIS_REST_URL
  ? new UpstashRateLimiter()
  : new InMemoryRateLimiter();
```

**Step 3: Update rate limiter keys in API routes**

In `app/api/og/route.ts` line 12, change `rateLimiter.check(ip)` to:
```ts
const limit = await rateLimiter.check(`og:${ip}`);
```

In `app/api/spaces/route.ts` line 8, change `rateLimiter.check(ip)` to:
```ts
const limit = await rateLimiter.check(`spaces:${ip}`);
```

`app/api/spaces/[token]/respond/route.ts` already uses `respond:${ip}:${token}` — no change needed.

**Step 4: Verify build + tests**

Run: `bun run build && bun run test`

**Step 5: Commit**

```bash
git add lib/adapters/upstash-rate-limiter.ts lib/container.ts app/api/og/route.ts app/api/spaces/route.ts
git commit -m "feat: Upstash Redis rate limiting with per-endpoint limits"
```

---

## Feature 5: Plausible Analytics

### Task 5.1: Create PlausibleAnalytics adapter

**Files:**
- Create: `lib/adapters/plausible-analytics.ts`
- Modify: `lib/container.ts:4,13`

**Step 1: Create the adapter**

```ts
// lib/adapters/plausible-analytics.ts
import type { IAnalytics } from "@/lib/interfaces";
import type { AnalyticsEvent } from "@/lib/types";

export class PlausibleAnalytics implements IAnalytics {
  private domain: string;
  private apiUrl = "https://plausible.io/api/event";

  constructor(domain: string) {
    this.domain = domain;
  }

  track(event: AnalyticsEvent): void {
    // Fire and forget — don't block the request
    fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: event.name,
        url: `https://${this.domain}`,
        domain: this.domain,
        props: event.properties ?? {},
      }),
    }).catch(() => {
      // Silently fail — analytics should never break the app
    });
  }
}
```

**Step 2: Update container.ts**

Add import and swap analytics:

```ts
import { PlausibleAnalytics } from "@/lib/adapters/plausible-analytics";

// Replace line 13:
export const analytics: IAnalytics = process.env.PLAUSIBLE_DOMAIN
  ? new PlausibleAnalytics(process.env.PLAUSIBLE_DOMAIN)
  : new NoopAnalytics();
```

**Step 3: Commit**

```bash
git add lib/adapters/plausible-analytics.ts lib/container.ts
git commit -m "feat: Plausible analytics adapter (server-side events)"
```

### Task 5.2: Add Plausible client-side script

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Add the script tag**

In `app/layout.tsx`, add the Plausible script inside `<head>` (via Next.js `<Script>`) only in production:

```tsx
import Script from "next/script";

// Inside the return, add before <body>:
<head>
  {process.env.PLAUSIBLE_DOMAIN && (
    <Script
      defer
      data-domain={process.env.PLAUSIBLE_DOMAIN}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  )}
</head>
```

**Step 2: Verify build**

Run: `bun run build`

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: Plausible client-side pageview tracking"
```

---

## Feature 6: QR Codes

### Task 6.1: Install qrcode package

**Step 1: Install**

Run: `bun add qrcode && bun add -d @types/qrcode`

**Step 2: Commit**

```bash
git add package.json bun.lock
git commit -m "deps: add qrcode for QR generation"
```

### Task 6.2: Create QR modal component

**Files:**
- Create: `components/ui/qr-modal.tsx`
- Create: `components/ui/qr-button.tsx`

**Step 1: Create QrModal**

```tsx
// components/ui/qr-modal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import QRCode from "qrcode";

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

    // Generate SVG for display
    QRCode.toString(url, { type: "svg", margin: 2, width: 256 }).then((svg) => {
      setSvgDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    });

    // Generate canvas for PNG download
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { margin: 2, width: 512, color: { dark: "#040c1f", light: "#ffffff" } });
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
            <div className="rounded-xl bg-white p-3">
              <img src={svgDataUrl} alt="QR Code" className="h-48 w-48" />
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
```

**Step 2: Create QrButton**

```tsx
// components/ui/qr-button.tsx
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
```

**Step 3: Verify build**

Run: `bun run build`

**Step 4: Commit**

```bash
git add components/ui/qr-modal.tsx components/ui/qr-button.tsx
git commit -m "feat: QR code modal with download"
```

### Task 6.3: Add QR button to surface page

**Files:**
- Modify: `app/[token]/page.tsx:94-96`

**Step 1: Import and add QR button next to CopyButton**

Add import: `import { QrButton } from "@/components/ui/qr-button";`

In the footer section (around line 94), add `<QrButton>` alongside `<CopyButton>`:

```tsx
<footer className="relative z-10 mt-auto flex flex-col items-center gap-4 pt-8 pb-6">
  <div className="flex items-center gap-3">
    <CopyButton url={surfaceUrl} />
    <QrButton url={surfaceUrl} />
  </div>
  {/* ... branding link below ... */}
</footer>
```

**Step 2: Verify build**

Run: `bun run build`

**Step 3: Commit**

```bash
git add app/[token]/page.tsx
git commit -m "feat: QR code button on surface page footer"
```

---

## Feature 7: E2E Playwright Tests

### Task 7.1: Install and configure Playwright

**Step 1: Install**

Run: `bun add -d @playwright/test`

Then install browsers: `bunx playwright install chromium`

**Step 2: Create playwright.config.ts**

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 3: Add test:e2e script to package.json**

Add to `scripts` in `package.json`:

```json
"test:e2e": "bunx playwright test"
```

**Step 4: Create e2e directory**

Run: `mkdir -p e2e`

**Step 5: Commit**

```bash
git add playwright.config.ts package.json e2e/
git commit -m "chore: Playwright E2E test setup"
```

### Task 7.2: Core flow E2E tests

**Files:**
- Create: `e2e/core-flows.spec.ts`

**Step 1: Write core flow tests**

```ts
// e2e/core-flows.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with Nyra hero and input field", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("input[placeholder*='Paste a link']")).toBeVisible();
    await expect(page.locator("img[alt*='Nyra']")).toBeVisible();
  });
});

test.describe("Surface creation — generic URL", () => {
  test("creates surface from URL and redirects", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill("https://example.com");
    await page.locator("button", { hasText: "Preview" }).click();

    // Wait for preview to appear
    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 15000 });

    await page.locator("button", { hasText: "Create shareable link" }).click();

    // Should redirect to surface page
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/[A-Za-z0-9]{7}$/);
  });
});

test.describe("404 page", () => {
  test("shows not-found for invalid token", async ({ page }) => {
    await page.goto("/zzzzzzznotreal");
    await expect(page.locator("text=not found").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Copy button", () => {
  test("copy button is visible on surface page", async ({ page }) => {
    // Create a surface first
    await page.goto("/");
    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill("https://example.com/copy-test");
    await page.locator("button", { hasText: "Preview" }).click();
    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 15000 });
    await page.locator("button", { hasText: "Create shareable link" }).click();
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });

    // Verify copy button exists
    await expect(page.locator("button", { hasText: /copy/i })).toBeVisible();
  });
});
```

**Step 2: Run tests**

Run: `bun run test:e2e`
Expected: Tests pass (requires dev server and database running)

**Step 3: Commit**

```bash
git add e2e/core-flows.spec.ts
git commit -m "test: core flow E2E tests (homepage, creation, 404, copy)"
```

### Task 7.3: Per-link-type E2E tests

**Files:**
- Create: `e2e/link-types.spec.ts`

**Step 1: Write per-link-type tests**

These tests verify that the create flow works for each link type and that the surface page renders the correct renderer. Since we need real OG fetching and the tests run against the dev server, we test the flow end-to-end with real URLs.

```ts
// e2e/link-types.spec.ts
import { test, expect } from "@playwright/test";

const LINK_TYPES = [
  { name: "YouTube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", badge: "Video" },
  { name: "Spotify", url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT", badge: "Spotify" },
  { name: "Instagram", url: "https://www.instagram.com/p/C1234567/", badge: "Instagram" },
  { name: "TikTok", url: "https://www.tiktok.com/@user/video/123456789", badge: "TikTok" },
  { name: "Google Maps", url: "https://maps.google.com/maps?q=Central+Park", badge: "Place" },
  { name: "X/Twitter", url: "https://x.com/user/status/123456789", badge: "Post" },
  { name: "Event", url: "https://www.eventbrite.com/e/test-event-123", badge: "Event" },
  { name: "PDF", url: "https://example.com/document.pdf", badge: "PDF" },
  { name: "Google Doc", url: "https://docs.google.com/document/d/abc123/edit", badge: "Google Doc" },
  { name: "Image", url: "https://example.com/photo.jpg", badge: "Image" },
  { name: "Generic", url: "https://example.com/blog-post", badge: "Link" },
];

for (const { name, url } of LINK_TYPES) {
  test(`creates surface for ${name} link`, async ({ page }) => {
    await page.goto("/");

    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill(url);
    await page.locator("button", { hasText: "Preview" }).click();

    // Wait for create button (OG fetch may take time)
    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 20000 });

    await page.locator("button", { hasText: "Create shareable link" }).click();

    // Should redirect to surface page with 7-char token
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });
  });
}
```

**Step 2: Run tests**

Run: `bun run test:e2e`

**Step 3: Commit**

```bash
git add e2e/link-types.spec.ts
git commit -m "test: per-link-type E2E tests for all 11 link types"
```

### Task 7.4: Error and edge case E2E tests

**Files:**
- Create: `e2e/error-cases.spec.ts`

**Step 1: Write error case tests**

```ts
// e2e/error-cases.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Input validation", () => {
  test("shows error for empty submit", async ({ page }) => {
    await page.goto("/");
    // Click Preview with empty input
    const input = page.locator("input[placeholder*='Paste a link']");
    await input.press("Enter");
    await expect(page.locator("text=Paste a link or type a title")).toBeVisible();
  });
});

test.describe("Free text surface", () => {
  test("creates surface from plain text (no URL)", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill("Movie night at my place");
    await page.locator("button", { hasText: "Preview" }).click();

    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 10000 });

    await page.locator("button", { hasText: "Create shareable link" }).click();
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });

    // Verify text is shown on surface
    await expect(page.locator("text=Movie night at my place")).toBeVisible();
  });
});

test.describe("QR Code", () => {
  test("QR button opens modal on surface page", async ({ page }) => {
    // Create a surface first
    await page.goto("/");
    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill("https://example.com/qr-test");
    await page.locator("button", { hasText: "Preview" }).click();
    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 15000 });
    await page.locator("button", { hasText: "Create shareable link" }).click();
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });

    // Click QR button
    await page.locator("button", { hasText: /QR/i }).click();

    // Modal should appear with QR image
    await expect(page.locator("text=Scan to open")).toBeVisible();
    await expect(page.locator("button", { hasText: /Download/i })).toBeVisible();
  });
});
```

**Step 2: Run all E2E tests**

Run: `bun run test:e2e`

**Step 3: Commit**

```bash
git add e2e/error-cases.spec.ts
git commit -m "test: error case and QR E2E tests"
```

---

## Final Verification

### Task FINAL: Full build + test suite

**Step 1: Run all unit tests**

Run: `bun run test`
Expected: All Vitest tests pass

**Step 2: Run full build**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 3: Run all E2E tests**

Run: `bun run test:e2e`
Expected: All Playwright tests pass

**Step 4: Verify git status is clean**

Run: `git status`
Expected: Clean working tree
