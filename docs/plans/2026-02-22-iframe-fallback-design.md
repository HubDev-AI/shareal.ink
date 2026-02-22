# Iframe Fallback System

> Ensure embedded content (Google Maps, Spotify, YouTube, TikTok, Instagram) degrades gracefully when iframes break.

## Problem

Five renderers use iframes for interactive embeds. If a platform changes its embed URL format, blocks embedding, or goes down, users see a blank/broken rectangle with no fallback. Every Space already stores an `imageUrl` (OG image) that could serve as a reliable fallback.

## Approach: OG Image Base Layer + Iframe Overlay

Always render the OG image first. Load the iframe on top in an invisible layer. Fade it in when ready. If it fails, the image stays visible.

### Why Not Runtime Error Detection?

Cross-origin iframes are opaque. The `load` event fires even on error pages (404, "Video unavailable"). Timeout-based detection catches CSP blocks and network errors but false-positives on slow connections and misses error pages that technically "loaded". The base-layer approach sidesteps this by never depending on error detection — the fallback is always visible until proven unnecessary.

## Shared Component: `<IframeWithFallback>`

Location: `components/surface/shared/iframe-with-fallback.tsx`

### Props

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Embed URL |
| `fallbackImage` | `string \| null` | OG imageUrl from Space |
| `fallbackUrl` | `string \| null` | originalUrl for "Open original" link |
| `title` | `string` | iframe title attribute |
| `className` | `string` | Container sizing/aspect-ratio classes |
| `iframeClassName` | `string` | Classes applied to the iframe element |
| `timeout` | `number` | Milliseconds before giving up (default: 8000) |
| `allow` | `string` | iframe `allow` attribute passthrough |
| `allowFullScreen` | `boolean` | iframe `allowFullScreen` passthrough |
| `onLoaded` | `() => void` | Optional callback when iframe loads |
| `onFailed` | `() => void` | Optional callback when iframe fails |

### State Machine

```
loading  →  loaded   (iframe `load` event fires → fade in iframe over image)
loading  →  failed   (timeout expires or `error` event → keep showing image + "Open original")
```

### Render Layers (bottom to top)

1. **OG image** — always visible initially. If no image, show a platform-themed placeholder with loading indicator.
2. **Iframe** — positioned absolutely on top, starts `opacity-0 pointer-events-none`, transitions to `opacity-100 pointer-events-auto` on `loaded` state.
3. **Failed overlay** — if `failed`, show subtle "Embed unavailable · Open original" link over the image.

### Timeout

8 seconds. Generous for most connections while not leaving users staring at a loading state too long. The OG image is visible the entire time so there's no perceived wait.

## Per-Renderer Changes

### Google Maps (`google-maps-renderer.tsx`)

Replace bare `<iframe>` with `<IframeWithFallback>`. Pass `space.imageUrl` as fallback. The OG image shows instantly; the interactive map fades in when ready.

### Spotify (`spotify-renderer.tsx`)

Same pattern. Replace bare `<iframe>` with `<IframeWithFallback>`.

### YouTube (`youtube-renderer.tsx`)

Already thumbnail-first. After user clicks play: swap thumbnail for `<IframeWithFallback>` instead of bare iframe. On failure, revert to thumbnail with "Couldn't load · Open on YouTube" message.

### TikTok (`tiktok-renderer.tsx`)

Same as YouTube. After play click, use `<IframeWithFallback>`. On failure, revert to thumbnail.

### Instagram (`instagram-renderer.tsx`)

Same as YouTube/TikTok. After play click, use `<IframeWithFallback>`. On failure, revert to thumbnail.

## Edge Cases

| Case | Handling |
|------|----------|
| No OG image stored | Platform-themed placeholder (muted icon + bg color) with loading spinner, then "Open original" on failure |
| Slow connection | 8s timeout. OG image shows instantly so user always sees content |
| Iframe loads error page | Not caught (cross-origin). Same as current behavior. Would require server-side health checks to fix — acceptable gap |
| Iframe loads then breaks later | Not handled (page already rendered). User can click "Open original" which is always available |

## Files Changed

- **New:** `components/surface/shared/iframe-with-fallback.tsx`
- **Modified:** 5 renderer files (google-maps, spotify, youtube, tiktok, instagram)
- **Tests:** Unit tests for IframeWithFallback component states
