# Card Size Constraints + Text Truncation — Design

> Date: 2026-02-22

## Problem

Surface cards grow unbounded when OG metadata contains large images or long text. Instagram posts are the worst offenders — the entire post caption becomes the OG title, and the image is aspect-square, creating cards that fill the viewport.

## Solution

Three constraints applied globally across all 11 renderers:

### 1. Image Height Cap (max 256px)

Cap all hero/thumbnail images to `max-h-64` (256px).

**Files affected:**
- `lib/config/link-types.ts` — update `imageHeight` values for types that exceed 256px
- `components/surface/renderers/instagram-renderer.tsx` — `max-h-96` → `max-h-64`
- `components/surface/renderers/youtube-renderer.tsx` — `max-h-80` → `max-h-64`
- `components/surface/renderers/tiktok-renderer.tsx` — add `max-h-64`

Types already within bounds (no change): google_maps (`h-52`), spotify (`h-20`), pdf (`h-32`), google_doc (`h-32`), x_twitter (`h-52`), event (`h-52`), generic (`h-52`).

### 2. Title — "Show more / Show less"

Create `components/surface/shared/truncated-text.tsx`:

- Default: `line-clamp-2` on title text
- Detect overflow via `useRef` + `scrollHeight > clientHeight`
- If overflowing, show "Show more" button (small, subtle, matches card style)
- On click: remove clamp, animate height with CSS Grid `grid-template-rows` pattern
- Show "Show less" when expanded
- Used by all renderers for title rendering

### 3. Description — Hard Truncate

- Standardize all description `line-clamp` to 3 lines across all renderers
- No expand toggle — descriptions are secondary; user clicks through for full text

## Files Changed

| File | Change |
|------|--------|
| `lib/config/link-types.ts` | Cap `imageHeight` values |
| `components/surface/shared/truncated-text.tsx` | New: reusable truncated text with show more/less |
| `components/surface/renderers/instagram-renderer.tsx` | Image max-h, use TruncatedText for title, line-clamp-3 description |
| `components/surface/renderers/youtube-renderer.tsx` | Image max-h, use TruncatedText for title |
| `components/surface/renderers/tiktok-renderer.tsx` | Image max-h, use TruncatedText for title |
| `components/surface/renderers/generic-renderer.tsx` | Use TruncatedText for title |
| `components/surface/renderers/google-maps-renderer.tsx` | Use TruncatedText for title |
| `components/surface/renderers/spotify-renderer.tsx` | Use TruncatedText for title |
| `components/surface/renderers/x-twitter-renderer.tsx` | Use TruncatedText for title |
| `components/surface/renderers/google-doc-renderer.tsx` | Use TruncatedText for title |
| `components/surface/renderers/image-renderer.tsx` | Use TruncatedText for title |
| `components/surface/renderers/pdf-renderer.tsx` | Use TruncatedText for title |
