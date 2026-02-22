# Link-Type Renderer Architecture — Design Document

**Date:** 2026-02-21
**Status:** Approved

---

## What

Replace the monolithic `SurfaceCard` with a **renderer registry** pattern. Each link type (Google Maps, YouTube, Instagram, TikTok, Spotify, X/Twitter) gets its own React component that controls the entire visual display for that link type. `SurfaceCard` becomes a thin shell handling shared concerns (glass card, animation, secondary actions).

## Why

The current architecture has link-specific logic scattered across `SurfaceCard` and `HeroImage` via conditional branches. Adding a new link type means touching multiple files and adding more `if` statements. This doesn't scale — we need Instagram, TikTok, Spotify, X/Twitter, and more.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Renderer registry (Approach A) | Cleanest separation; each renderer is a self-contained component file. No slot system, no abstractions. |
| Map display | Interactive Google Maps embed iframe | User preference — pan/zoom inside the surface card |
| Social embeds | oEmbed where available, iframe fallback | Instagram, TikTok, X all provide oEmbed endpoints |
| Music embeds | Spotify embed iframe | Spotify provides `/embed/track/` URLs |
| DB storage for extras | JSON column on Space | Flexible key-value for renderer-specific metadata (coords, embed URLs, video IDs) |
| Migration strategy | Rename old types, add new ones | `restaurant` → `google_maps`, `video` → `youtube` |

---

## Architecture

### Expanded Link Types

```
google_maps | youtube | instagram | tiktok | spotify | x_twitter | event | generic
```

Replaces the current `restaurant | video | event | generic`. The regex detector maps URLs to these specific types.

### Renderer Interface

```tsx
interface RendererProps {
  space: SpaceData;
  theme: SurfaceTheme;
}
```

Every renderer is a React component receiving `RendererProps`. It owns everything between the card's top edge and the secondary actions bar:
- Hero area (map embed, video player, image, album art, etc.)
- Title treatment
- Description
- Link-specific widgets (coords badge, play controls, embed iframe)

### Registry

```tsx
// components/surface/renderers/index.ts
const registry: Record<LinkType, ComponentType<RendererProps>> = {
  google_maps: GoogleMapsRenderer,
  youtube: YouTubeRenderer,
  instagram: InstagramRenderer,
  tiktok: TikTokRenderer,
  spotify: SpotifyRenderer,
  x_twitter: XTwitterRenderer,
  event: GenericRenderer,
  generic: GenericRenderer,
};

export function getRenderer(linkType: LinkType) {
  return registry[linkType] ?? registry.generic;
}
```

### Simplified SurfaceCard

```tsx
export function SurfaceCard({ space }: { space: SpaceData }) {
  const Renderer = getRenderer(space.linkType);

  return (
    <motion.div className={`${theme.card} ...`}>
      <Renderer space={space} theme={theme} />

      {/* Shared across all types */}
      {showAction && <ActionButton ... />}
      {showAction && <ResponseCounter ... />}
      <SecondaryActions ... />
    </motion.div>
  );
}
```

---

## Renderers

### GoogleMapsRenderer
- Interactive Google Maps embed iframe using coords from the resolved URL
- Place name as title
- `CoordsBadge` for copy-to-clipboard coordinates
- Falls back to "Open in Google Maps" link if coords can't be extracted
- Fix: store resolved URL (not short URL) so coords are always available

### YouTubeRenderer
- Thumbnail hero with play button overlay
- Click plays inline via iframe embed
- Moves existing logic from `HeroImage` into its own renderer
- External link overlay to open on YouTube

### InstagramRenderer
- Uses Instagram's oEmbed endpoint to get embed HTML
- Renders post image with caption
- Links to original post

### TikTokRenderer
- Uses TikTok's oEmbed endpoint
- Renders video embed iframe
- Links to original

### SpotifyRenderer
- Converts track/album/playlist URL to embed URL (`/embed/track/`)
- Renders compact Spotify player widget iframe
- Album art as fallback when embed isn't available

### XTwitterRenderer
- Uses X/Twitter oEmbed to render the tweet
- Falls back to title + description if embed fails
- Styled to match the glass aesthetic

### GenericRenderer
- Current behavior: OG image hero, title, description
- The fallback for any URL without a specific renderer

---

## Site Extractors

Each site extractor can return renderer-specific metadata via an `extras` field:

```tsx
interface SiteExtractorResult {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  extras?: Record<string, string>;
}
```

Examples:
- Google Maps: `{ coords: "42.69, 23.32", placeId: "ChIJ..." }`
- YouTube: `{ videoId: "dQw4w9WgXcQ" }`
- Spotify: `{ embedUrl: "https://open.spotify.com/embed/track/..." }`

This flows through to the DB (`extras` JSON column on Space) and into `SpaceData`.

---

## DB Migration

1. Add `extras Json?` column to Space model
2. Update `LinkType` enum:
   - Remove: `restaurant`, `video`
   - Add: `google_maps`, `youtube`, `instagram`, `tiktok`, `spotify`, `x_twitter`
3. Data migration: `restaurant` → `google_maps`, `video` → `youtube`

---

## File Structure

```
components/surface/
  surface-card.tsx              # Thin shell (glass card, animation, shared actions)
  renderers/
    index.ts                    # Registry + getRenderer()
    renderer-props.ts           # Shared RendererProps interface
    google-maps-renderer.tsx
    youtube-renderer.tsx
    instagram-renderer.tsx
    tiktok-renderer.tsx
    spotify-renderer.tsx
    x-twitter-renderer.tsx
    generic-renderer.tsx
  shared/                       # Reusable pieces across renderers
    coords-badge.tsx
    hero-image.tsx              # Simplified, used by generic renderer
    action-button.tsx
    response-counter.tsx
    secondary-actions.tsx

lib/adapters/site-extractors/
  index.ts                      # Existing, add new extractors
  types.ts                      # Updated with extras field
  google-maps.ts                # Updated to return extras.coords
  youtube.ts                    # Updated to return extras.videoId
  instagram.ts                  # New
  tiktok.ts                     # New
  spotify.ts                    # New
  x-twitter.ts                  # New
```

---

## OG Fetch Fix for Short URLs

The Google Maps short URL (`maps.app.goo.gl`) OG fetch is failing because Google blocks the bot. Two fixes:
1. Store the **resolved URL** (after redirects) in the `extras` field, so even if scraping fails, we have the full URL for coord extraction
2. The OG fetcher already follows redirects (`response.url`) — pipe `finalUrl` into extras via the site extractor

---

## What's NOT In Scope

- Custom themes per link type (future)
- oEmbed proxy/caching service (inline for now)
- Admin dashboard for managing renderers
- Server-side rendering of embeds (all client-side iframes)
