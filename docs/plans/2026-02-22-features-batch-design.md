# Features Batch Design — 2026-02-22

> Seven features for shareal.ink post-MVP: short tokens, document/image cards, Plausible analytics, QR codes, Redis rate limiting, platform-flavored previews, and E2E tests.

---

## 1. Short Tokens (22-char → 7-char)

**Problem:** Current 22-char base62 tokens are overkill. `shareal.ink/aBcDeFgHiJkLmNoPqRsT12` is ugly in chat messages. 7 chars = 3.5 trillion combinations — more than enough.

**Changes:**
- `lib/tokens.ts`: `customAlphabet(BASE62, 7)` (was 22)
- `prisma/schema.prisma`: `@db.VarChar(7)` (was VarChar(22))
- Migration: `ALTER COLUMN token TYPE VARCHAR(7)` + `UPDATE spaces SET token = <new 7-char>` for existing rows
- Belt-and-suspenders: retry with new token on unique constraint violation (collision probability ~0 at current scale but costs nothing to handle)

**Result:** `shareal.ink/aB3x7Kp` — clean, memorable, shareable.

**Risk:** Breaks any previously shared links. Acceptable — pre-launch, no real users yet.

---

## 2. Document & Image Link Types

**Problem:** PDFs, Google Docs, and direct image links all fall into `generic` with no specialized treatment.

### New LinkType enum values

| Type | Detection Pattern | Badge |
|------|------------------|-------|
| `pdf` | URL ending in `.pdf` (case-insensitive) | `bg-red-100 text-red-700` "PDF" |
| `google_doc` | `docs.google.com`, `sheets.google.com`, `slides.google.com`, `drive.google.com` | `bg-blue-100 text-blue-700` "Google Doc" |
| `image` | URL ending in `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg` | `bg-violet-100 text-violet-700` "Image" |

### Schema change

Add `pdf`, `google_doc`, `image` to the `LinkType` enum in `prisma/schema.prisma`.

### Detection rules (regex-link-detector.ts)

```
{ pattern: /\.pdf(\?|$)/i, linkType: "pdf" }
{ pattern: /(docs|sheets|slides|drive)\.google\.com/i, linkType: "google_doc" }
{ pattern: /\.(jpe?g|png|gif|webp|svg)(\?|$)/i, linkType: "image" }
```

Place PDF and image rules **before** the generic fallback but **after** platform-specific rules (a YouTube thumbnail URL ending in `.jpg` should still match YouTube).

### Surface renderers

- **PdfRenderer**: Document file icon (lucide `FileText`), title from OG or filename extraction, "PDF" badge, "Open PDF" action button linking to original URL.
- **GoogleDocRenderer**: Google icon matching doc sub-type (inferred from hostname — Doc/Sheets/Slides), title from OG, appropriate badge, "Open in Google Docs" action.
- **ImageRenderer**: Image displayed as full-width card hero (like YouTube thumbnails but uncropped), filename as subtitle, "View Image" action. Uses `object-contain` instead of `object-cover` to show the full image.

### Preview renderers (homepage)

- **PDF preview**: File icon + title + "PDF" badge (compact)
- **Google Doc preview**: Google icon + title + doc type badge
- **Image preview**: The image itself displayed in the preview card, scaled to fit

### Config (link-types.ts)

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

---

## 3. Plausible Analytics

**Problem:** Need analytics without giving data to Google. Plausible is privacy-first, GDPR-compliant, < 1KB script, no cookies.

### Client-side (pageviews)

Add the Plausible script to `app/layout.tsx`:

```html
<script defer data-domain="shareal.ink" src="https://plausible.io/js/script.js" />
```

Only loads in production (`process.env.NODE_ENV === "production"`).

### Server-side (custom events)

Create `PlausibleAnalytics` adapter implementing `IAnalytics`:

```ts
class PlausibleAnalytics implements IAnalytics {
  async track(event: AnalyticsEvent): Promise<void> {
    // POST to https://plausible.io/api/event
    // Headers: Content-Type: application/json
    // Body: { name, url, domain, props }
  }
}
```

Swap in `container.ts`: `NoopAnalytics` → `PlausibleAnalytics` (behind env flag `PLAUSIBLE_DOMAIN`).

### Events to track

| Event | Trigger | Properties |
|-------|---------|------------|
| `space.created` | POST `/api/spaces` success | `linkType`, `intentType` |
| `space.viewed` | GET `/[token]` page render | `linkType` |
| `response.recorded` | POST `/api/spaces/[token]/respond` | `responseType` |

### Cost

~$9/month on Plausible Cloud. Self-hosting is possible on Railway but not worth the ops overhead for now.

---

## 4. QR Codes

**Problem:** No way to share a surface via QR — useful for in-person sharing, presentations, print.

### Library

`qrcode` — pure JS, generates SVG/PNG, ~15KB, no native deps.

### Placement 1: Surface page

- QR icon button in footer, next to existing `CopyButton`
- Click opens a modal (using our glass card aesthetic) showing:
  - QR code as SVG (encodes `shareal.ink/{token}`)
  - "Download PNG" button
  - The URL as text below the QR
- Modal dismissable via click-outside or X button

### Placement 2: Creation flow

- After space creation, before redirect to surface page:
  - Show a brief creation-success screen with the QR code + copy button
  - Auto-redirect after 3 seconds (or click to go immediately)
- **Alternative (simpler):** Show QR in the CopyToast on the surface page after creation. The toast already shows "Link copied!" — extend it with a small QR code.

Recommend the simpler approach: QR in CopyToast + QR button on surface footer. Avoids a new intermediate screen.

### QR styling

- Dark QR on light background (standard, best scan reliability)
- Rounded corners on the modal
- Optional: Nyra icon in QR center using QR error correction level H (30% redundancy)

### New components

- `components/ui/qr-modal.tsx` — modal with QR SVG + download
- `components/ui/qr-button.tsx` — the trigger button (QR icon from lucide)

---

## 5. Redis Rate Limiting

**Problem:** Current `InMemoryRateLimiter` resets on deploy and doesn't work across Vercel instances.

### Library

`@upstash/ratelimit` — designed for Upstash Redis on serverless (Vercel). Sliding window algorithm, no Redis scripting needed.

### New adapter

`UpstashRateLimiter` implementing `IRateLimiter`:

```ts
class UpstashRateLimiter implements IRateLimiter {
  private limiters: Record<string, Ratelimit>;

  constructor() {
    const redis = Redis.fromEnv(); // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
    this.limiters = {
      default: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s") }),
      respond: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s") }),
    };
  }

  async check(key: string): Promise<RateLimitResult> {
    // Parse prefix from key (e.g. "respond:ip:token" → use respond limiter)
    const limiterKey = key.startsWith("respond:") ? "respond" : "default";
    const result = await this.limiters[limiterKey].limit(key);
    return { allowed: result.success, remaining: result.remaining, resetAt: result.reset };
  }
}
```

### Per-endpoint limits

| Endpoint | Key pattern | Limit | Window |
|----------|------------|-------|--------|
| POST `/api/og` | `og:{ip}` | 10/min | 60s |
| POST `/api/spaces` | `spaces:{ip}` | 10/min | 60s |
| POST `/api/spaces/[token]/respond` | `respond:{ip}:{token}` | 30/min | 60s |

### Swap in container.ts

```ts
export const rateLimiter: IRateLimiter = process.env.UPSTASH_REDIS_REST_URL
  ? new UpstashRateLimiter()
  : new InMemoryRateLimiter();
```

Falls back to in-memory for local dev (no Upstash needed locally).

### Environment variables (production)

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Update API routes

Change key patterns in existing routes:
- `/api/og`: `rateLimiter.check(\`og:${ip}\`)`
- `/api/spaces`: `rateLimiter.check(\`spaces:${ip}\`)`
- `/api/spaces/[token]/respond`: already uses `respond:${ip}:${token}` (good)

---

## 6. Platform-Flavored Previews

**Problem:** The homepage create-flow preview (`LinkPreview`) is one generic card for ALL link types. It doesn't reflect what the surface will actually look like. The surface renderers are rich and specialized, but the preview is always the same basic OG card.

### Solution: Per-link-type preview renderers

Replace the single `LinkPreview` component with a preview renderer registry (mirroring the surface renderer pattern).

### Architecture

```
components/create/preview-renderers/
  index.ts              → getPreviewRenderer(linkType) registry
  renderer-props.ts     → shared PreviewRendererProps interface
  youtube-preview.tsx   → YouTube-specific preview
  spotify-preview.tsx   → Spotify-specific preview
  instagram-preview.tsx → Instagram-specific preview
  tiktok-preview.tsx    → TikTok-specific preview
  google-maps-preview.tsx → Maps-specific preview
  x-twitter-preview.tsx → X/Twitter-specific preview
  generic-preview.tsx   → Generic fallback (current LinkPreview behavior)
  pdf-preview.tsx       → PDF document card
  google-doc-preview.tsx → Google Docs card
  image-preview.tsx     → Image card
```

### Per-type preview behavior

| Link Type | Preview Renderer | Key Visual |
|-----------|-----------------|------------|
| `youtube` | Thumbnail in 16:9 with red-tinted play button overlay | Play icon, "Video" badge |
| `spotify` | Compact Spotify embed (152px) or album art + green accent | Music note, "Spotify" badge |
| `instagram` | Thumbnail in 1:1 with IG gradient icon overlay | Instagram icon, "Instagram" badge |
| `tiktok` | Thumbnail in 9:16 (compact, max-h-48) with play overlay | Play icon, "TikTok" badge |
| `google_maps` | Mini map iframe embed (200px tall) | Map pin, "Place" badge |
| `x_twitter` | Tweet blockquote widget (compact, dark theme) | X icon, "Post" badge |
| `generic` | Current behavior: OG image + title + description | "Link" badge |
| `event` | Current behavior with event-specific badge | Calendar icon, "Event" badge |
| `pdf` | File icon + filename + page count if available | FileText icon, "PDF" badge |
| `google_doc` | Google icon + doc title + doc type sub-badge | Google icon, "Google Doc" badge |
| `image` | The actual image, scaled to fit (object-contain) | Image icon, "Image" badge |

### PreviewRendererProps

```ts
interface PreviewRendererProps {
  linkType: LinkType;
  metadata: OgMetadata | null;
  extras: Record<string, string> | null;
  loading: boolean;
  title: string | null;
  originalUrl: string | null;
}
```

Note: Extras need to be passed through from the OG job to the preview. Currently `extras` is available from the OG job response but not forwarded to `LinkPreview`. The create form will need to thread `extras` through.

### Surface renderer platform accents

Also enhance existing surface renderers with platform brand colors:

| Renderer | Current Play/Icon Color | New Accent |
|----------|------------------------|------------|
| YouTube | White circle, dark play | **Red** play button (#FF0000) |
| Spotify | (uses official embed) | **Green** fallback accent (#1DB954) |
| Instagram | White circle, dark IG icon | **Gradient** circle (pink→purple→orange) |
| TikTok | White circle, dark play | **Cyan/pink** TikTok dual-tone overlay |
| Google Maps | (uses official embed) | **Green** pin accent (#34A853) |
| X/Twitter | (uses official widget) | No change needed |

---

## 7. E2E Playwright Tests

**Problem:** No E2E test infrastructure. Only Vitest unit tests (46 tests). Need to verify all user flows end-to-end.

### Setup

- Install `@playwright/test`
- `playwright.config.ts` with `webServer: { command: "bun run dev", port: 3000 }`
- Test directory: `e2e/`
- Add `bun run test:e2e` script

### Test journeys

#### Core flows
1. **Homepage loads** — Nyra hero visible, input field present, branding visible
2. **Create surface (generic URL)** — paste URL → preview appears → fill intent → select intent type → create → redirected to surface page → copy toast shown
3. **Surface page renders** — title, description, action button, copy button, Nyra seal, branding, timestamp
4. **Response flow (meet)** — on a "meet" surface, click "I'm in!", verify count increments
5. **Vote flow** — on a "vote" surface, click thumbs up/down
6. **Copy button** — click copy button on surface, verify toast
7. **404 page** — navigate to `/nonexistent-token`, verify not-found page
8. **Free text (no URL)** — type text (not a URL), preview shows text-only card, create, surface renders text-only

#### Per-link-type surfaces
9. **YouTube surface** — create with YouTube URL, verify video thumbnail + play button on surface
10. **Spotify surface** — create with Spotify URL, verify Spotify embed on surface
11. **Instagram surface** — create with Instagram URL, verify IG thumbnail on surface
12. **TikTok surface** — create with TikTok URL, verify TikTok thumbnail on surface
13. **Google Maps surface** — create with Maps URL, verify map embed on surface
14. **X/Twitter surface** — create with tweet URL, verify tweet widget on surface
15. **PDF surface** — create with .pdf URL, verify PDF card on surface
16. **Google Doc surface** — create with docs.google.com URL, verify doc card on surface
17. **Image surface** — create with .jpg URL, verify image display on surface

#### Error & edge cases
18. **Rate limiting** — send rapid requests, verify 429 response
19. **Invalid input** — empty input, verify error message
20. **Long input** — exceed character limit, verify error message

### Test data

Use a seeded test database or mock API responses. For OG fetching, mock the `/api/og` endpoint to return predictable metadata per link type (avoid hitting real URLs in CI).

### CI integration

GitHub Actions workflow running Playwright on push to `dev`. Upload test artifacts (screenshots, traces) on failure.

---

## Dependencies (new packages)

| Package | Purpose | Size |
|---------|---------|------|
| `qrcode` | QR code SVG/PNG generation | ~15KB |
| `@upstash/ratelimit` | Redis-backed rate limiting | ~5KB |
| `@upstash/redis` | Redis client for Upstash REST API | ~10KB |
| `@playwright/test` | E2E testing (dev dep) | ~50MB (browsers) |

Plausible requires no npm package — just a script tag + fetch calls.

---

## Implementation order (suggested)

1. **Short tokens** — quick win, schema change, sets foundation
2. **Document & image link types** — new enum values, detectors, renderers
3. **Platform-flavored previews** — preview renderer registry + surface accent colors
4. **Redis rate limiting** — swap adapter, tune limits
5. **Plausible analytics** — swap adapter, add script
6. **QR codes** — new UI components
7. **E2E tests** — test everything above
