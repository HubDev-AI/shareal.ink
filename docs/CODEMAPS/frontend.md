<!-- Generated: 2026-02-22 | Files scanned: ~50 | Token estimate: ~700 -->
# Frontend

## Pages
```
/            — Static RSC. NyraHero + CreateForm + ComingSoonBadge
/[token]     — SSR. Dynamic OG meta + SurfaceCard + CopyButton + QrButton + ShareButton
/not-found   — Static 404. Logo + "This link doesn't exist" + CTA
```

## Component Hierarchy
```
app/layout.tsx (Plus Jakarta Sans, global meta, Plausible)
├── app/page.tsx (homepage)
│   └── HomeContent (client wrapper)
│       ├── NyraHero (breathing animation, collapses on preview)
│       └── CreateForm (317 lines, state machine: idle→fetching→previewing→creating)
│           ├── IntentTypePills (meet/vote/share selector)
│           └── LinkPreview → getPreviewRenderer(linkType)
│               └── [YoutubePreview | GoogleMapsPreview | SpotifyPreview | ...]
│                   └── PreviewContent (badge + title + description skeletons)
│
├── app/[token]/page.tsx (surface page)
│   ├── SurfaceCard (95 lines, motion animations)
│   │   ├── getRenderer(linkType) → [YoutubeRenderer | GoogleMapsRenderer | ...]
│   │   │   └── HeroImage | IframeWithFallback | RendererContent | TruncatedText
│   │   ├── IntentMarkdown
│   │   ├── ActionButton (meet/share) OR VoteButtons (vote intent)
│   │   │   └── ResponseCounter
│   │   └── SecondaryActions ("Open original" link)
│   ├── CopyButton + CopyToast
│   ├── QrButton → QrModal (with Nyra logo)
│   ├── ShareButton (Web Share API)
│   └── NyraSeal (15% opacity watermark)
```

## Renderer Registry Pattern
Two parallel registries — MUST stay in sync:

| Registry | Location | Usage |
|----------|----------|-------|
| Surface renderers | `components/surface/renderers/index.ts` | Full interactive embeds on /[token] |
| Preview renderers | `components/create/preview-renderers/index.ts` | Lightweight thumbnails on homepage |

Both use `getRenderer()`/`getPreviewRenderer()` factory → maps LinkType to component.

## 11 Link Types
google_maps, youtube, instagram, tiktok, spotify, x_twitter, event, pdf, google_doc, image, generic

## Styling
- Tailwind CSS 4 with custom tokens in globals.css
- Aurora background gradient (per-linkType tint via CSS custom properties)
- Glass-surface card style (backdrop-blur, border, shadow)
- motion (framer-motion) for card entry animations
- CSS Grid `grid-template-rows: 0fr/1fr` for smooth collapse transitions
