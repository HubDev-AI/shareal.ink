# Link-Type Renderer Architecture — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the monolithic SurfaceCard with a renderer registry where each link type (Google Maps, YouTube, Instagram, TikTok, Spotify, X/Twitter) has its own display component.

**Architecture:** Each link type maps to a renderer component via a registry. SurfaceCard becomes a thin shell that looks up the renderer and delegates. Site extractors return structured `extras` metadata (coords, embed URLs, video IDs) stored as JSON in the Space model.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Prisma 7, Tailwind CSS 4, Motion

---

## Task 1: DB Migration — Add `extras` Column and New Link Types

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma.config.ts` (no change expected, just verify)

**Step 1: Update the Prisma schema**

Add `extras` JSON column to Space and OgJob models. Update the `LinkType` enum.

```prisma
enum LinkType {
  google_maps
  youtube
  instagram
  tiktok
  spotify
  x_twitter
  event
  generic
}

model Space {
  // ... existing fields ...
  extras Json? @map("extras")
  // ...
}

model OgJob {
  // ... existing fields ...
  extras Json? @map("extras")
  // ...
}
```

**Step 2: Create the migration**

Run: `bunx prisma migrate dev --name add-extras-and-link-types`

This will:
- Add the `extras` column to `spaces` and `og_jobs` tables
- Update the `LinkType` enum (Prisma handles this for PostgreSQL)

**Important:** You need a running PostgreSQL. If local dev has existing data with `restaurant`/`video` types, you'll need a SQL data migration. Create a manual SQL step:

```sql
-- Run BEFORE the Prisma migration if you have existing data:
UPDATE spaces SET link_type = 'google_maps' WHERE link_type = 'restaurant';
UPDATE spaces SET link_type = 'youtube' WHERE link_type = 'video';
UPDATE og_jobs SET link_type = 'google_maps' WHERE link_type = 'restaurant';
UPDATE og_jobs SET link_type = 'youtube' WHERE link_type = 'video';
```

**Step 3: Regenerate Prisma client**

Run: `bunx prisma generate`

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add extras JSON column and expand LinkType enum"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `lib/types.ts`

**Step 1: Update the LinkType union and add extras to SpaceData**

In `lib/types.ts`:

```ts
export type LinkType = "google_maps" | "youtube" | "instagram" | "tiktok" | "spotify" | "x_twitter" | "event" | "generic";
```

Add `extras` to relevant interfaces:

```ts
export interface OgMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  extras?: Record<string, string> | null;
}

export interface SpaceData {
  // ... existing fields ...
  extras: Record<string, string> | null;
}

export interface OgJobData {
  // ... existing fields ...
  extras: Record<string, string> | null;
}
```

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: expand LinkType union and add extras to types"
```

---

## Task 3: Update Link Type Config

**Files:**
- Modify: `lib/config/link-types.ts`

**Step 1: Replace old link types with new ones**

Replace the entire `linkTypeConfig` record. Keep the `LinkTypeConfig` interface but update the entries:

```ts
export const linkTypeConfig: Record<LinkType, LinkTypeConfig> = {
  google_maps: {
    label: "Place",
    imageHeight: "h-52",
    imageOverlay: true,
    showAction: true,
    actionLabel: "I'm in!",
    badge: { bg: "bg-emerald-100", text: "text-emerald-700" },
  },
  youtube: {
    label: "Video",
    imageHeight: "aspect-video",
    imageOverlay: false,
    showAction: false,
    actionLabel: "I'll watch it",
    badge: { bg: "bg-red-100", text: "text-red-700" },
  },
  instagram: {
    label: "Instagram",
    imageHeight: "aspect-square",
    imageOverlay: false,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-pink-100", text: "text-pink-700" },
  },
  tiktok: {
    label: "TikTok",
    imageHeight: "aspect-[9/16]",
    imageOverlay: false,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-gray-100", text: "text-gray-700" },
  },
  spotify: {
    label: "Spotify",
    imageHeight: "h-20",
    imageOverlay: false,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-green-100", text: "text-green-700" },
  },
  x_twitter: {
    label: "Post",
    imageHeight: "h-52",
    imageOverlay: false,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-blue-100", text: "text-blue-700" },
  },
  event: {
    label: "Event",
    imageHeight: "h-52",
    imageOverlay: false,
    showAction: true,
    actionLabel: "I'm in!",
    badge: { bg: "bg-blue-100", text: "text-blue-700" },
  },
  generic: {
    label: "Link",
    imageHeight: "h-52",
    imageOverlay: true,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-gray-100", text: "text-gray-600" },
  },
};
```

**Step 2: Commit**

```bash
git add lib/config/link-types.ts
git commit -m "feat: link type config for all new types"
```

---

## Task 4: Update Regex Link Detector

**Files:**
- Modify: `lib/adapters/regex-link-detector.ts`
- Modify: `lib/__tests__/regex-link-detector.test.ts`

**Step 1: Write failing tests for new link types**

Add tests for the new link types in `lib/__tests__/regex-link-detector.test.ts`:

```ts
// New tests to add:
it("detects Google Maps as google_maps", () => {
  const result = detector.detect("https://maps.google.com/maps?q=Pizza+Place");
  expect(result.linkType).toBe("google_maps");
});

it("detects maps.app.goo.gl as google_maps", () => {
  const result = detector.detect("https://maps.app.goo.gl/abc123");
  expect(result.linkType).toBe("google_maps");
});

it("detects YouTube as youtube", () => {
  const result = detector.detect("https://www.youtube.com/watch?v=abc123");
  expect(result.linkType).toBe("youtube");
});

it("detects Instagram post as instagram", () => {
  const result = detector.detect("https://www.instagram.com/p/abc123/");
  expect(result.linkType).toBe("instagram");
});

it("detects Instagram reel as instagram", () => {
  const result = detector.detect("https://www.instagram.com/reel/abc123/");
  expect(result.linkType).toBe("instagram");
});

it("detects TikTok as tiktok", () => {
  const result = detector.detect("https://www.tiktok.com/@user/video/123");
  expect(result.linkType).toBe("tiktok");
});

it("detects Spotify track as spotify", () => {
  const result = detector.detect("https://open.spotify.com/track/abc123");
  expect(result.linkType).toBe("spotify");
});

it("detects Spotify playlist as spotify", () => {
  const result = detector.detect("https://open.spotify.com/playlist/abc123");
  expect(result.linkType).toBe("spotify");
});

it("detects X/Twitter post as x_twitter", () => {
  const result = detector.detect("https://x.com/user/status/123");
  expect(result.linkType).toBe("x_twitter");
});

it("detects twitter.com as x_twitter", () => {
  const result = detector.detect("https://twitter.com/user/status/123");
  expect(result.linkType).toBe("x_twitter");
});
```

**Step 2: Run tests to verify they fail**

Run: `bun run test`
Expected: Multiple failures (old types still say "restaurant", "video", new types not detected)

**Step 3: Update the detector rules**

In `lib/adapters/regex-link-detector.ts`, replace RULES:

```ts
const RULES: PatternRule[] = [
  // Places / Maps
  { pattern: /maps\.google\.|google\.\w+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/i, linkType: "google_maps" },
  { pattern: /yelp\.com/i, linkType: "google_maps" },
  { pattern: /opentable\.com/i, linkType: "google_maps" },
  { pattern: /resy\.com/i, linkType: "google_maps" },
  { pattern: /tripadvisor\.com/i, linkType: "google_maps" },

  // Video — YouTube
  { pattern: /youtube\.com|youtu\.be/i, linkType: "youtube" },

  // Video — TikTok
  { pattern: /tiktok\.com/i, linkType: "tiktok" },

  // Video — other (Vimeo → generic for now)
  { pattern: /vimeo\.com/i, linkType: "generic" },

  // Social — Instagram
  { pattern: /instagram\.com/i, linkType: "instagram" },

  // Social — X/Twitter
  { pattern: /^https?:\/\/(www\.)?(x|twitter)\.com/i, linkType: "x_twitter" },

  // Music — Spotify
  { pattern: /open\.spotify\.com/i, linkType: "spotify" },

  // Events
  { pattern: /eventbrite\.com/i, linkType: "event" },
  { pattern: /meetup\.com/i, linkType: "event" },
  { pattern: /lu\.ma/i, linkType: "event" },
];
```

**Note:** `maps.app.goo.gl` is now matched explicitly. TikTok gets its own type instead of `video`. Vimeo falls to `generic` (no special renderer yet).

**Step 4: Update old tests**

Update existing test assertions: `"restaurant"` → `"google_maps"`, `"video"` → `"youtube"` or `"tiktok"`. Remove the Vimeo→video test (it's now generic). Remove TikTok→video test (it's now tiktok).

**Step 5: Run tests to verify they pass**

Run: `bun run test`
Expected: All PASS

**Step 6: Commit**

```bash
git add lib/adapters/regex-link-detector.ts lib/__tests__/regex-link-detector.test.ts
git commit -m "feat: link detector for all new types (maps, instagram, tiktok, spotify, x)"
```

---

## Task 5: Update Site Extractor Types with `extras`

**Files:**
- Modify: `lib/adapters/site-extractors/types.ts`
- Modify: `lib/adapters/site-extractors/index.ts`

**Step 1: Add extras to SiteExtractorResult**

```ts
export interface SiteExtractorResult {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  extras?: Record<string, string>;
}
```

**Step 2: Update enhanceMetadata to pass through extras**

In `index.ts`, update `enhanceMetadata` return to include extras:

```ts
export function enhanceMetadata(finalUrl: string, og: OgMetadata): OgMetadata {
  for (const extractor of extractors) {
    if (extractor.matches(finalUrl)) {
      const overrides = extractor.extract(finalUrl, og);
      return {
        title: overrides.title !== undefined ? overrides.title : og.title,
        description: overrides.description !== undefined ? overrides.description : og.description,
        imageUrl: overrides.imageUrl !== undefined ? overrides.imageUrl : og.imageUrl,
        extras: overrides.extras ?? og.extras ?? null,
      };
    }
  }
  return og;
}
```

**Step 3: Commit**

```bash
git add lib/adapters/site-extractors/
git commit -m "feat: add extras to site extractor pipeline"
```

---

## Task 6: Update Google Maps Extractor to Return Structured Extras

**Files:**
- Modify: `lib/adapters/site-extractors/google-maps.ts`

**Step 1: Return coords and resolvedUrl in extras instead of embedding in description**

Update the extractor to return coords as structured extras rather than baking them into the description string. The description should be clean text only.

```ts
extract(finalUrl: string, og: OgMetadata) {
  try {
    const u = new URL(finalUrl);
    const coords = extractCoords(u.pathname + u.search);

    const extras: Record<string, string> = {};
    if (coords) extras.coords = coords;
    extras.resolvedUrl = finalUrl;

    const placeMatch = u.pathname.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      const name = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
      if (name) {
        return {
          title: name,
          description: isGenericDescription(og.description) ? null : og.description,
          extras,
        };
      }
    }

    const searchMatch = u.pathname.match(/\/maps\/search\/([^/@]+)/);
    if (searchMatch) {
      const query = decodeURIComponent(searchMatch[1].replace(/\+/g, " ")).trim();
      if (query) {
        return {
          title: query,
          description: isGenericDescription(og.description) ? null : og.description,
          extras,
        };
      }
    }

    if (coords) {
      return {
        description: isGenericDescription(og.description) ? null : og.description,
        extras,
      };
    }
  } catch { /* ignore */ }
  return {};
},
```

**Step 2: Commit**

```bash
git add lib/adapters/site-extractors/google-maps.ts
git commit -m "refactor: Google Maps extractor returns structured extras"
```

---

## Task 7: Update YouTube Extractor to Return Structured Extras

**Files:**
- Modify: `lib/adapters/site-extractors/youtube.ts`

**Step 1: Add videoId to extras**

```ts
extract(finalUrl: string, og: OgMetadata) {
  const videoId = extractVideoId(finalUrl);
  const extras: Record<string, string> = {};
  if (videoId) extras.videoId = videoId;

  if (videoId && (!og.imageUrl || og.imageUrl.includes("hqdefault"))) {
    return {
      imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      extras,
    };
  }

  return { extras };
},
```

**Step 2: Commit**

```bash
git add lib/adapters/site-extractors/youtube.ts
git commit -m "refactor: YouTube extractor returns videoId in extras"
```

---

## Task 8: Create New Site Extractors (Instagram, TikTok, Spotify, X)

**Files:**
- Create: `lib/adapters/site-extractors/instagram.ts`
- Create: `lib/adapters/site-extractors/tiktok.ts`
- Create: `lib/adapters/site-extractors/spotify.ts`
- Create: `lib/adapters/site-extractors/x-twitter.ts`
- Modify: `lib/adapters/site-extractors/index.ts`

**Step 1: Create Instagram extractor**

```ts
// lib/adapters/site-extractors/instagram.ts
import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const instagramExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      return new URL(finalUrl).hostname.includes("instagram.com");
    } catch { return false; }
  },
  extract(finalUrl: string, og: OgMetadata) {
    // Extract post/reel shortcode from URL
    const m = finalUrl.match(/\/(p|reel|tv)\/([^/?]+)/);
    const extras: Record<string, string> = {};
    if (m) extras.shortcode = m[2];
    extras.resolvedUrl = finalUrl;
    return { extras };
  },
};
```

**Step 2: Create TikTok extractor**

```ts
// lib/adapters/site-extractors/tiktok.ts
import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const tiktokExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      return new URL(finalUrl).hostname.includes("tiktok.com");
    } catch { return false; }
  },
  extract(finalUrl: string, og: OgMetadata) {
    const extras: Record<string, string> = { resolvedUrl: finalUrl };
    // Extract video ID from /@user/video/ID pattern
    const m = finalUrl.match(/\/video\/(\d+)/);
    if (m) extras.videoId = m[1];
    return { extras };
  },
};
```

**Step 3: Create Spotify extractor**

```ts
// lib/adapters/site-extractors/spotify.ts
import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const spotifyExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      return new URL(finalUrl).hostname === "open.spotify.com";
    } catch { return false; }
  },
  extract(finalUrl: string, og: OgMetadata) {
    const extras: Record<string, string> = { resolvedUrl: finalUrl };
    // Convert open.spotify.com/track/ID → open.spotify.com/embed/track/ID
    try {
      const u = new URL(finalUrl);
      // Matches /track/ID, /album/ID, /playlist/ID, /episode/ID
      const m = u.pathname.match(/^\/(track|album|playlist|episode)\/([^/?]+)/);
      if (m) {
        extras.embedUrl = `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
        extras.contentType = m[1];
        extras.contentId = m[2];
      }
    } catch { /* ignore */ }
    return { extras };
  },
};
```

**Step 4: Create X/Twitter extractor**

```ts
// lib/adapters/site-extractors/x-twitter.ts
import type { SiteExtractor } from "./types";
import type { OgMetadata } from "@/lib/types";

export const xTwitterExtractor: SiteExtractor = {
  matches(finalUrl: string): boolean {
    try {
      const h = new URL(finalUrl).hostname;
      return h === "x.com" || h === "www.x.com" || h.includes("twitter.com");
    } catch { return false; }
  },
  extract(finalUrl: string, og: OgMetadata) {
    const extras: Record<string, string> = { resolvedUrl: finalUrl };
    // Extract /user/status/ID
    const m = finalUrl.match(/\/status\/(\d+)/);
    if (m) extras.tweetId = m[1];
    return { extras };
  },
};
```

**Step 5: Register all new extractors in index.ts**

Add imports and register in the `extractors` array:

```ts
import { instagramExtractor } from "./instagram";
import { tiktokExtractor } from "./tiktok";
import { spotifyExtractor } from "./spotify";
import { xTwitterExtractor } from "./x-twitter";

const extractors: SiteExtractor[] = [
  googleMapsExtractor,
  youtubeExtractor,
  instagramExtractor,
  tiktokExtractor,
  spotifyExtractor,
  xTwitterExtractor,
];
```

**Step 6: Commit**

```bash
git add lib/adapters/site-extractors/
git commit -m "feat: site extractors for Instagram, TikTok, Spotify, X/Twitter"
```

---

## Task 9: Update OG Fetcher and Worker to Pipe Extras

**Files:**
- Modify: `lib/adapters/metascraper-og-fetcher.ts`
- Modify: `lib/worker.ts`

**Step 1: Update OG fetcher to return extras from enhanceMetadata**

The `enhanceMetadata` function now returns extras. Update `MetascraperOgFetcher.fetch()` to include them in the `OgMetadata` return:

```ts
const og: OgMetadata = {
  title: raw.title || null,
  description: raw.description || null,
  imageUrl: raw.image || null,
};

const enhanced = enhanceMetadata(finalUrl, og);
return enhanced;
```

(This should already work since `enhanceMetadata` returns the full `OgMetadata` including extras.)

**Step 2: Update worker to save extras to DB**

In `lib/worker.ts`, update the `prisma.ogJob.update` and `prisma.space.updateMany` calls to include extras:

```ts
await prisma.ogJob.update({
  where: { id: ogJobId },
  data: {
    status: metadata.title ? "completed" : "failed",
    title: metadata.title,
    description: metadata.description,
    imageUrl: metadata.imageUrl,
    extras: metadata.extras ?? undefined,
    error: metadata.title ? null : "Failed to extract metadata",
    completedAt: new Date(),
  },
});

await prisma.space.updateMany({
  where: { ogJobId },
  data: {
    title: metadata.title,
    description: metadata.description,
    imageUrl: metadata.imageUrl,
    extras: metadata.extras ?? undefined,
  },
});
```

**Step 3: Commit**

```bash
git add lib/adapters/metascraper-og-fetcher.ts lib/worker.ts
git commit -m "feat: pipe extras through OG fetch → worker → DB"
```

---

## Task 10: Update Space API Routes to Include Extras

**Files:**
- Modify: `app/api/spaces/route.ts` (POST — create space)
- Modify: `app/api/spaces/[token]/route.ts` (GET — fetch space)
- Modify: `app/[token]/page.tsx` (SSR page — pass extras to SpaceData)

**Step 1: Update POST /api/spaces to accept and store extras**

When creating a space from a completed OG job, also copy the extras:

```ts
if (ogJob?.status === "completed") {
  ogTitle = ogTitle ?? ogJob.title;
  ogDescription = ogDescription ?? ogJob.description;
  ogImageUrl = ogJob.imageUrl;
  // Add: ogExtras = ogJob.extras
}
```

And include in `prisma.space.create`:
```ts
extras: ogExtras ?? null,
```

**Step 2: Update GET /api/spaces/[token] to return extras**

Read the route file. If it returns `space` data, ensure `extras` is included in the response.

**Step 3: Update the SSR page to pass extras to SpaceData**

In `app/[token]/page.tsx`, add extras to the `spaceData` object:

```ts
const spaceData: SpaceData = {
  // ... existing fields ...
  extras: (space.extras as Record<string, string>) ?? null,
};
```

**Step 4: Commit**

```bash
git add app/api/spaces/ app/\[token\]/page.tsx
git commit -m "feat: pipe extras through API routes and SSR page"
```

---

## Task 11: Create Renderer Interface and Registry

**Files:**
- Create: `components/surface/renderers/renderer-props.ts`
- Create: `components/surface/renderers/index.ts`

**Step 1: Create the shared renderer props interface**

```ts
// components/surface/renderers/renderer-props.ts
import type { SpaceData } from "@/lib/types";
import type { SurfaceTheme } from "@/lib/config/themes";

export interface RendererProps {
  space: SpaceData;
  theme: SurfaceTheme;
}
```

**Step 2: Create the registry (initially with just GenericRenderer as placeholder)**

```ts
// components/surface/renderers/index.ts
import type { ComponentType } from "react";
import type { RendererProps } from "./renderer-props";
import type { LinkType } from "@/lib/types";
import { GenericRenderer } from "./generic-renderer";

const registry: Record<LinkType, ComponentType<RendererProps>> = {
  google_maps: GenericRenderer,  // placeholder
  youtube: GenericRenderer,       // placeholder
  instagram: GenericRenderer,     // placeholder
  tiktok: GenericRenderer,        // placeholder
  spotify: GenericRenderer,       // placeholder
  x_twitter: GenericRenderer,     // placeholder
  event: GenericRenderer,
  generic: GenericRenderer,
};

export function getRenderer(linkType: LinkType): ComponentType<RendererProps> {
  return registry[linkType] ?? registry.generic;
}
```

**Step 3: Commit**

```bash
git add components/surface/renderers/
git commit -m "feat: renderer registry with shared props interface"
```

---

## Task 12: Create GenericRenderer (Extract from SurfaceCard)

**Files:**
- Create: `components/surface/renderers/generic-renderer.tsx`
- Move: `components/surface/hero-image.tsx` → `components/surface/shared/hero-image.tsx`
- Move: `components/surface/coords-badge.tsx` → `components/surface/shared/coords-badge.tsx`
- Move: `components/surface/action-button.tsx` → `components/surface/shared/action-button.tsx`
- Move: `components/surface/response-counter.tsx` → `components/surface/shared/response-counter.tsx`
- Move: `components/surface/secondary-actions.tsx` → `components/surface/shared/secondary-actions.tsx`

**Step 1: Move shared components to `shared/` directory**

Use `git mv` to move:
```bash
mkdir -p components/surface/shared
git mv components/surface/hero-image.tsx components/surface/shared/
git mv components/surface/coords-badge.tsx components/surface/shared/
git mv components/surface/action-button.tsx components/surface/shared/
git mv components/surface/response-counter.tsx components/surface/shared/
git mv components/surface/secondary-actions.tsx components/surface/shared/
```

Update all import paths in moved files (they import from `@/lib/...` so most don't change).

**Step 2: Create GenericRenderer**

Extract the current title/description/hero rendering from `SurfaceCard` into `GenericRenderer`:

```tsx
// components/surface/renderers/generic-renderer.tsx
"use client";

import { motion } from "motion/react";
import { HeroImage } from "../shared/hero-image";
import type { RendererProps } from "./renderer-props";

export function GenericRenderer({ space, theme }: RendererProps) {
  const isTextOnly = !space.originalUrl && !space.imageUrl;

  return (
    <>
      {!isTextOnly && (
        <HeroImage
          imageUrl={space.imageUrl}
          title={space.title}
          linkType={space.linkType}
          originalUrl={space.originalUrl}
        />
      )}

      <div className={isTextOnly ? "px-8 py-8 sm:px-12 sm:py-10 text-center" : "px-6 pt-5"}>
        {space.title && (
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className={
              isTextOnly
                ? `${space.title.length <= 40 ? "text-3xl sm:text-5xl font-semibold leading-tight tracking-tight" : theme.textTitle} bg-gradient-to-br from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent`
                : "text-[22px] font-semibold leading-tight tracking-tight text-white"
            }
          >
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : (
              space.title
            )}
          </motion.h1>
        )}

        {space.description && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-4"
          >
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
```

**Step 3: Commit**

```bash
git add components/surface/
git commit -m "refactor: extract GenericRenderer, move shared components"
```

---

## Task 13: Refactor SurfaceCard to Use Renderer Registry

**Files:**
- Modify: `components/surface/surface-card.tsx`

**Step 1: Replace inline rendering with registry lookup**

```tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { getRenderer } from "./renderers";
import { ActionButton } from "./shared/action-button";
import { ResponseCounter } from "./shared/response-counter";
import { SecondaryActions } from "./shared/secondary-actions";
import { linkTypeConfig } from "@/lib/config/link-types";
import { defaultTheme } from "@/lib/config/themes";
import type { SpaceData } from "@/lib/types";

interface SurfaceCardProps {
  space: SpaceData;
}

export function SurfaceCard({ space }: SurfaceCardProps) {
  const [count, setCount] = useState(space.responseCount);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink"}/${space.token}`;
  const config = linkTypeConfig[space.linkType];
  const theme = defaultTheme;
  const showAction = config.showAction;
  const Renderer = getRenderer(space.linkType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`${theme.card} mx-auto ${theme.cardWidth}`}
    >
      <Renderer space={space} theme={theme} />

      <div className="space-y-5 p-6 pt-0">
        {showAction && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <ActionButton
              token={space.token}
              label={space.primaryActionLabel}
              initialCount={count}
              onCountChange={setCount}
            />
          </motion.div>
        )}

        {showAction && <ResponseCounter count={count} />}

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <SecondaryActions
            originalUrl={space.originalUrl}
            shareUrl={shareUrl}
            title={space.title}
          />
        </motion.div>

        {space.originalUrl && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="break-all text-center text-[11px] tracking-wide text-white/20"
          >
            {space.originalUrl}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
```

**Step 2: Verify dev server works**

Run: `bun run dev` and check a surface page loads without errors.

**Step 3: Commit**

```bash
git add components/surface/surface-card.tsx
git commit -m "refactor: SurfaceCard delegates to renderer registry"
```

---

## Task 14: Create GoogleMapsRenderer

**Files:**
- Create: `components/surface/renderers/google-maps-renderer.tsx`
- Modify: `components/surface/renderers/index.ts` (wire it up)

**Step 1: Create the renderer**

```tsx
// components/surface/renderers/google-maps-renderer.tsx
"use client";

import { motion } from "motion/react";
import { CoordsBadge } from "../shared/coords-badge";
import type { RendererProps } from "./renderer-props";

function getEmbedUrl(space: RendererProps["space"]): string | null {
  const coords = space.extras?.coords;
  const title = space.title;

  // Prefer place search by name + coords for accurate pin
  if (title && coords) {
    const q = encodeURIComponent(title);
    return `https://www.google.com/maps/embed/v1/search?key=&q=${q}&center=${coords.replace(/\s/g, "")}`;
  }

  // Fallback: use coords as the query
  if (coords) {
    return `https://www.google.com/maps/embed/v1/place?key=&q=${coords.replace(/\s/g, "")}`;
  }

  // Last resort: use originalUrl
  if (space.originalUrl) {
    const encoded = encodeURIComponent(space.originalUrl);
    return `https://maps.google.com/maps?q=${encoded}&output=embed`;
  }

  return null;
}

export function GoogleMapsRenderer({ space, theme }: RendererProps) {
  const coords = space.extras?.coords ?? null;
  const embedUrl = getEmbedUrl(space);

  return (
    <>
      {/* Map embed */}
      {embedUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-white/[0.03]">
          <iframe
            src={embedUrl}
            title={space.title ?? "Map"}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : space.originalUrl ? (
        <a
          href={space.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-32 w-full items-center justify-center rounded-t-2xl bg-white/[0.03] text-white/30 hover:bg-white/[0.06] transition-colors"
        >
          Open in Google Maps
        </a>
      ) : null}

      {/* Title + coords */}
      <div className="px-6 pt-5">
        {space.title && (
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="text-[22px] font-semibold leading-tight tracking-tight text-white"
          >
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : (
              space.title
            )}
          </motion.h1>
        )}

        {space.description && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-4"
          >
            {space.description}
          </motion.p>
        )}

        {coords && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="mt-3"
          >
            <CoordsBadge coords={coords} />
          </motion.div>
        )}
      </div>
    </>
  );
}
```

**Note on Maps Embed API:** The `key=` parameter in the embed URL. Google Maps Embed API requires an API key for the `/embed/v1/` endpoints. The `maps.google.com/maps?q=...&output=embed` URL works **without** an API key. Use the keyless approach:

```ts
// Keyless embed — works without API key
function getEmbedUrl(space: RendererProps["space"]): string | null {
  const coords = space.extras?.coords;
  const title = space.title;

  if (title && coords) {
    const q = encodeURIComponent(`${title} @${coords}`);
    return `https://maps.google.com/maps?q=${q}&output=embed`;
  }
  if (coords) {
    return `https://maps.google.com/maps?q=${coords.replace(/\s/g, "")}&output=embed`;
  }
  if (space.originalUrl) {
    const encoded = encodeURIComponent(space.originalUrl);
    return `https://maps.google.com/maps?q=${encoded}&output=embed`;
  }
  return null;
}
```

**Step 2: Wire into registry**

In `components/surface/renderers/index.ts`:
```ts
import { GoogleMapsRenderer } from "./google-maps-renderer";
// ...
google_maps: GoogleMapsRenderer,
```

**Step 3: Commit**

```bash
git add components/surface/renderers/
git commit -m "feat: GoogleMapsRenderer with interactive map embed"
```

---

## Task 15: Create YouTubeRenderer

**Files:**
- Create: `components/surface/renderers/youtube-renderer.tsx`
- Modify: `components/surface/renderers/index.ts`

**Step 1: Create the renderer**

Move the YouTube embed logic from `hero-image.tsx` into its own renderer. Use `extras.videoId` when available, fall back to URL parsing.

```tsx
// components/surface/renderers/youtube-renderer.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Play } from "lucide-react";
import type { RendererProps } from "./renderer-props";

function getVideoId(space: RendererProps["space"]): string | null {
  if (space.extras?.videoId) return space.extras.videoId;
  if (!space.originalUrl) return null;
  try {
    const u = new URL(space.originalUrl);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = u.pathname.match(/\/(shorts|embed|live|v)\/([^/?]+)/);
    if (m) return m[2];
  } catch { /* ignore */ }
  return null;
}

export function YouTubeRenderer({ space, theme }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const videoId = getVideoId(space);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : space.imageUrl;

  return (
    <>
      {/* Video area */}
      {playing && embedUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-black">
          <iframe
            src={embedUrl}
            title={space.title ?? "Video"}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
          {space.originalUrl && (
            <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
               className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
          )}
        </div>
      ) : thumbnail && !imgError ? (
        <div className="group relative aspect-video w-full overflow-hidden rounded-t-2xl">
          <Image src={thumbnail} alt={space.title ?? "Video thumbnail"} fill
                 className="object-cover" onError={() => setImgError(true)} unoptimized priority />
          <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
          <button type="button"
                  onClick={() => embedUrl ? setPlaying(true) : space.originalUrl && window.open(space.originalUrl, "_blank")}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6 fill-[#040c1f] text-[#040c1f]" />
            </div>
          </button>
          {space.originalUrl && (
            <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
          )}
        </div>
      ) : null}

      {/* Title + description */}
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

**Step 2: Wire into registry**

```ts
import { YouTubeRenderer } from "./youtube-renderer";
youtube: YouTubeRenderer,
```

**Step 3: Commit**

```bash
git add components/surface/renderers/
git commit -m "feat: YouTubeRenderer with inline playback"
```

---

## Task 16: Create InstagramRenderer

**Files:**
- Create: `components/surface/renderers/instagram-renderer.tsx`
- Modify: `components/surface/renderers/index.ts`

**Step 1: Create the renderer**

Instagram provides an oEmbed endpoint. However, since 2020 it requires authentication. Use the simpler approach: render OG image + metadata, with a link to the post.

```tsx
// components/surface/renderers/instagram-renderer.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { Instagram } from "lucide-react";
import type { RendererProps } from "./renderer-props";

export function InstagramRenderer({ space, theme }: RendererProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <>
      {/* Post image */}
      {space.imageUrl && !imgError ? (
        <a href={space.originalUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="group block">
          <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl">
            <Image src={space.imageUrl} alt={space.title ?? "Instagram post"} fill
                   className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                   onError={() => setImgError(true)} unoptimized priority />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
              <Instagram className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
        </a>
      ) : space.originalUrl ? (
        <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-32 w-full items-center justify-center gap-2 rounded-t-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-white/40 hover:text-white/60 transition-colors">
          <Instagram className="h-5 w-5" />
          <span className="text-sm">View on Instagram</span>
        </a>
      ) : null}

      {/* Caption */}
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
                    className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-4">
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
```

**Step 2: Wire into registry and commit**

```bash
git add components/surface/renderers/
git commit -m "feat: InstagramRenderer with post image display"
```

---

## Task 17: Create TikTokRenderer

**Files:**
- Create: `components/surface/renderers/tiktok-renderer.tsx`
- Modify: `components/surface/renderers/index.ts`

**Step 1: Create the renderer**

TikTok provides a public oEmbed endpoint (no auth needed). Use the embed iframe.

```tsx
// components/surface/renderers/tiktok-renderer.tsx
"use client";

import { motion } from "motion/react";
import type { RendererProps } from "./renderer-props";

function getTikTokEmbedUrl(space: RendererProps["space"]): string | null {
  const videoId = space.extras?.videoId;
  if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`;
  return null;
}

export function TikTokRenderer({ space, theme }: RendererProps) {
  const embedUrl = getTikTokEmbedUrl(space);

  return (
    <>
      {embedUrl ? (
        <div className="relative mx-auto w-full max-w-[325px] overflow-hidden rounded-t-2xl bg-black">
          <iframe
            src={embedUrl}
            title={space.title ?? "TikTok video"}
            className="h-[575px] w-full border-0"
            allowFullScreen
            allow="encrypted-media"
          />
        </div>
      ) : space.originalUrl ? (
        <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-32 w-full items-center justify-center rounded-t-2xl bg-white/[0.03] text-white/40 hover:text-white/60 transition-colors">
          <span className="text-sm">View on TikTok</span>
        </a>
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

**Step 2: Wire into registry and commit**

```bash
git add components/surface/renderers/
git commit -m "feat: TikTokRenderer with embed iframe"
```

---

## Task 18: Create SpotifyRenderer

**Files:**
- Create: `components/surface/renderers/spotify-renderer.tsx`
- Modify: `components/surface/renderers/index.ts`

**Step 1: Create the renderer**

Spotify embed iframes are public — just swap the URL path to include `/embed/`.

```tsx
// components/surface/renderers/spotify-renderer.tsx
"use client";

import { motion } from "motion/react";
import type { RendererProps } from "./renderer-props";

function getSpotifyEmbedUrl(space: RendererProps["space"]): string | null {
  if (space.extras?.embedUrl) return space.extras.embedUrl;
  if (!space.originalUrl) return null;
  try {
    const u = new URL(space.originalUrl);
    if (u.hostname !== "open.spotify.com") return null;
    const m = u.pathname.match(/^\/(track|album|playlist|episode)\/([^/?]+)/);
    if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
  } catch { /* ignore */ }
  return null;
}

export function SpotifyRenderer({ space, theme }: RendererProps) {
  const embedUrl = getSpotifyEmbedUrl(space);
  const isCompact = space.extras?.contentType === "track" || space.extras?.contentType === "episode";

  return (
    <>
      {embedUrl ? (
        <div className="w-full overflow-hidden rounded-t-2xl">
          <iframe
            src={embedUrl}
            title={space.title ?? "Spotify"}
            className={`w-full border-0 ${isCompact ? "h-[152px]" : "h-[352px]"}`}
            allow="encrypted-media"
            loading="lazy"
          />
        </div>
      ) : space.originalUrl ? (
        <a href={space.originalUrl} target="_blank" rel="noopener noreferrer"
           className="flex h-32 w-full items-center justify-center rounded-t-2xl bg-gradient-to-br from-green-500/10 to-green-700/10 text-white/40 hover:text-white/60 transition-colors">
          <span className="text-sm">Listen on Spotify</span>
        </a>
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

**Step 2: Wire into registry and commit**

```bash
git add components/surface/renderers/
git commit -m "feat: SpotifyRenderer with embed player"
```

---

## Task 19: Create XTwitterRenderer

**Files:**
- Create: `components/surface/renderers/x-twitter-renderer.tsx`
- Modify: `components/surface/renderers/index.ts`

**Step 1: Create the renderer**

X/Twitter embeds require their widgets.js script. Use a client-side approach: render a blockquote with the tweet URL and load the Twitter widget script.

```tsx
// components/surface/renderers/x-twitter-renderer.tsx
"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { RendererProps } from "./renderer-props";

export function XTwitterRenderer({ space, theme }: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tweetId = space.extras?.tweetId;
  const tweetUrl = space.originalUrl;

  useEffect(() => {
    if (!tweetUrl || !containerRef.current) return;

    // Load Twitter widget script if not already loaded
    const win = window as typeof window & { twttr?: { widgets: { load: (el?: HTMLElement) => void } } };
    if (win.twttr?.widgets) {
      win.twttr.widgets.load(containerRef.current);
    } else {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, [tweetUrl]);

  return (
    <>
      {tweetUrl ? (
        <div ref={containerRef} className="w-full overflow-hidden rounded-t-2xl bg-white/[0.03] px-4 py-4">
          <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
            <a href={tweetUrl}>{space.title ?? "View post"}</a>
          </blockquote>
        </div>
      ) : null}

      <div className="px-6 pt-5">
        {space.title && !tweetUrl && (
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.15, duration: 0.3 }}
                     className="text-[22px] font-semibold leading-tight tracking-tight text-white">
            {space.title}
          </motion.h1>
        )}
        {space.description && !tweetUrl && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-4">
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
```

**Step 2: Wire into registry and commit**

```bash
git add components/surface/renderers/
git commit -m "feat: XTwitterRenderer with embedded tweet"
```

---

## Task 20: Update Tests

**Files:**
- Modify: `lib/__tests__/regex-link-detector.test.ts` (already done in Task 4)
- Modify: `lib/__tests__/validation.test.ts` (if it references old LinkType values)

**Step 1: Run all tests**

Run: `bun run test`

Fix any failures caused by the type rename (`restaurant` → `google_maps`, `video` → `youtube`).

**Step 2: Commit**

```bash
git add lib/__tests__/
git commit -m "test: update tests for new link types"
```

---

## Task 21: Clean Up Old HeroImage YouTube Logic

**Files:**
- Modify: `components/surface/shared/hero-image.tsx`

**Step 1: Remove YouTube-specific logic from HeroImage**

Since YouTube now has its own renderer, HeroImage only needs to handle the generic case: image display with optional link overlay. Remove:
- `getYouTubeEmbedUrl` function
- `playing` state
- Video embed rendering
- Play button

Keep only: image display with hover overlay and link wrapping.

**Step 2: Commit**

```bash
git add components/surface/shared/hero-image.tsx
git commit -m "refactor: simplify HeroImage now that YouTube has its own renderer"
```

---

## Task 22: Final Verification and PR

**Step 1: Run tests**

Run: `bun run test`
Expected: All pass

**Step 2: Run dev server and manually test**

Run: `bun run dev`

Test each link type by creating surfaces with:
- Google Maps link (e.g. `https://maps.app.goo.gl/...`)
- YouTube link (e.g. `https://youtu.be/dQw4w9WgXcQ`)
- Instagram link (e.g. `https://www.instagram.com/p/...`)
- TikTok link (e.g. `https://www.tiktok.com/@user/video/...`)
- Spotify link (e.g. `https://open.spotify.com/track/...`)
- X/Twitter link (e.g. `https://x.com/user/status/...`)
- Plain text (generic renderer)
- Random URL (generic renderer)

**Step 3: Create PR**

```bash
git push -u origin feat/link-type-renderers
gh pr create --base dev --title "feat: link-type renderer architecture"
```
