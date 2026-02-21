# shareal.ink MVP — Design Document

**Date:** 2026-02-21
**Status:** Approved
**Branch:** claude/compassionate-booth

---

## What

"One link = One beautiful surface." Turn any shared link (or free text) into a clean, structured planning surface with a primary action. Initial wedge: restaurant/meetup planning, but supports any link from day 1.

## Why

Validate whether users prefer sharing a structured link instead of a raw URL, and whether it reduces coordination friction.

---

## Decisions

| Question | Decision |
|----------|----------|
| Intent types (MVP) | Meet only. Vote/share intents pre-wired in schema but not exposed in UI |
| Link types | restaurant, video, event, generic — detected automatically |
| Non-URL input | Supported — becomes a text-only surface (no OG job) |
| OG fetching | metascraper, async via BullMQ + Upstash Redis |
| Creation blocking | Non-blocking — user can create before OG completes |
| UI components | Hand-built Tailwind, Apple HIG-informed |
| Expiration | Column in schema (nullable), not enforced in MVP |
| Auth | NoopAuthProvider — anonymous. Adapter ready for Clerk/NextAuth |
| Who can create | Anyone, no auth |
| Analytics | NoopAnalytics — track calls exist, no-op until plugged in |
| Package manager | bun |
| Hosting | Vercel (app) + Railway (PostgreSQL) + Upstash (Redis) |

---

## Architecture

### System Components

- **Next.js 16** on Vercel — App Router, SSR, API routes
- **PostgreSQL 16** on Railway — Space, Response, OgJob tables
- **Upstash Redis** — BullMQ queue backend
- **BullMQ worker** — runs inside API route handler on Vercel serverless

### Adapter Architecture

Every external dependency gets an **interface + adapter** pattern. API routes and components import from `lib/container.ts`, never from adapters directly. Swap one line to change any integration.

```
Interface (lib/interfaces/)     →  Adapter (lib/adapters/)
─────────────────────────────      ────────────────────────
IOgFetcher                     →  MetascraperOgFetcher
IQueue                         →  BullMQAdapter
ICache                         →  UpstashRedisAdapter
IStorage                       →  PrismaStorageAdapter
IAuthProvider                  →  NoopAuthProvider
IAnalytics                     →  NoopAnalytics
IRateLimiter                   →  InMemoryRateLimiter
ILinkDetector                  →  RegexLinkDetector
IImageStore                    →  PassthroughImageStore
```

**Container wiring** (`lib/container.ts`):
```typescript
export const ogFetcher: IOgFetcher = new MetascraperOgFetcher();
export const queue: IQueue = new BullMQAdapter(redis);
export const auth: IAuthProvider = new NoopAuthProvider();
export const analytics: IAnalytics = new NoopAnalytics();
export const rateLimiter: IRateLimiter = new InMemoryRateLimiter();
export const linkDetector: ILinkDetector = new RegexLinkDetector();
export const imageStore: IImageStore = new PassthroughImageStore();
```

Noop adapters enable feature code to call `auth.getCurrentUser()` and `analytics.track()` now — they no-op until a real adapter is swapped in.

---

## Data Flow

### Creation Flow

```
User pastes URL (or types free text)
    → POST /api/og { url }
    → If valid URL: create OgJob (status: "processing"), enqueue BullMQ job
    → If free text: return { jobId: null, linkType: "generic", title: input }
    → Returns { jobId, linkType } immediately (~50ms)

Frontend polls GET /api/og/[jobId] every 1.5s (only if jobId exists)
    → Returns { status, metadata? }
    → Preview fills progressively (skeleton → type badge → title → image)

User clicks "Create" (at ANY point — doesn't wait for OG)
    → POST /api/spaces { url, jobId?, title?, description?, linkType }
    → Creates Space with available metadata
    → If OG job still running, worker updates Space when done
    → Returns { token }
    → Redirect to /{token}
```

### Surface View Flow

```
Recipient opens shareal.ink/{token}
    → Server component: Prisma query for Space + response count
    → generateMetadata() for dynamic OG tags (WhatsApp/Discord/iMessage)
    → Renders SurfaceCard
    → POST /api/spaces/[token]/respond for RSVP
```

### BullMQ Worker Flow

```
Job picked up from queue
    → metascraper fetches URL (8s timeout, custom User-Agent)
    → Google Maps fallback: parse place name from URL path
    → Updates OgJob (status: "completed", metadata)
    → If Space references this ogJobId, update Space too
    → On failure: retry 2x exponential backoff, then mark "failed" (hostname fallback)
```

---

## Data Model

### Space

| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Internal PK |
| token | varchar(22) | Unique, URL-facing. nanoid base62 |
| originalUrl | text? | Nullable — free text input has no URL |
| title | text? | From OG, user edit, or raw input. Nullable until enriched |
| description | text? | From OG |
| imageUrl | text? | From OG |
| linkType | enum: restaurant \| video \| event \| generic | From link-detector |
| intentType | enum: meet \| vote \| share | Default "meet". Only "meet" exposed in MVP |
| primaryActionLabel | text | "I'm in!" / "I'll watch it" / "Interested" |
| ogJobId | varchar? | FK to OgJob. Null for free-text inputs |
| creatorUserId | varchar? | Null in MVP (NoopAuth). Ready for auth |
| expiresAt | timestamp? | Null in MVP. Ready for expiration |
| createdAt | timestamp | |

### Response

| Column | Type | Notes |
|--------|------|-------|
| id | cuid | PK |
| spaceId | varchar | FK → Space, cascade delete |
| responseType | enum: yes \| no | |
| createdAt | timestamp | |

Index on `spaceId`.

### OgJob

| Column | Type | Notes |
|--------|------|-------|
| id | cuid | PK |
| url | text | URL being fetched |
| status | enum: processing \| completed \| failed | |
| title | text? | Extracted metadata |
| description | text? | |
| imageUrl | text? | |
| linkType | enum: restaurant \| video \| event \| generic | |
| error | text? | Failure reason |
| createdAt | timestamp | |
| completedAt | timestamp? | |

Snake_case DB columns via `@map()`, camelCase in Prisma models.

---

## API Routes

| Route | Method | Purpose | Rate limited |
|-------|--------|---------|-------------|
| `/api/og` | POST | Accept input, create OgJob if URL, enqueue job. Returns `{ jobId, linkType }` | Yes |
| `/api/og/[jobId]` | GET | Poll OG job status. Returns `{ status, metadata? }` | No |
| `/api/spaces` | POST | Create space. Returns `{ token, url }` | Yes |
| `/api/spaces/[token]` | GET | Fetch space + response count | No |
| `/api/spaces/[token]/respond` | POST | Record response. Returns `{ count }` | Yes |

Rate limit: IP-based, in-memory sliding window, 20 req/min on mutation routes.

---

## Link Type Detection

| linkType | URL patterns | Action label |
|----------|-------------|--------------|
| restaurant | Google Maps, Yelp, OpenTable, Resy, TripAdvisor | "I'm in!" |
| video | YouTube, Vimeo, TikTok | "I'll watch it" |
| event | Eventbrite, Meetup, Lu.ma | "I'm in!" |
| generic | Everything else / free text | "Interested" |

### Input Validation Chain

```
Input → trim → is it a valid http(s) URL?
  YES → detect link type → queue OG job → proceed
  NO  → is it non-empty text?
    YES → linkType "generic", text as title, no OG job
    NO  → inline error "Paste a link or type a title"
```

Malformed/dangerous: sanitize URL, reject non-http schemes, strip scripts.

---

## UI Design

### Screen 1: Homepage (`/`)

Single column, vertically centered, max-width 720px. Off-white (#FAFAF8).

**Hierarchy:** Wordmark → tagline → **input** (dominant) → preview card → create button.

**States:** idle → typing → fetching OG (skeleton pulse) → preview loaded → creating (spinner) → redirect.

User can hit "Create" at any state after typing.

### Screen 2: Surface (`/{token}`)

Single column, centered, max-width 720px. The "beautiful surface."

**Hierarchy:** Hero image (gradient fallback) → type badge → title → description → primary action button (56px, full-width) → response counter → secondary actions (Open link | Copy | Share).

**States:** fresh (no responses) → responded ("You're in!", disabled) → OG loading (skeleton hero/title) → no image (text-forward, no hero).

localStorage dedup for response tracking.

### Screen 3: 404

"This link doesn't exist" + CTA to create.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| CreateForm | Client | Input + creation state machine |
| LinkPreview | Client | OG preview with skeleton states |
| SurfaceCard | Server | Surface layout |
| HeroImage | Client | next/image + gradient fallback |
| ActionButton | Client | Primary CTA + optimistic response + localStorage |
| ResponseCounter | Client | Animated count (Motion) |
| SecondaryActions | Client | Open link, Copy, Share (Web Share API) |
| TypeBadge | Server | Link type pill |
| Skeleton | Client | Reusable pulse loader |
| Button | Client | Base with variants (primary, secondary, ghost) |
| Input | Client | Styled with focus ring |

### Micro-interactions

- Preview appear: fade-in + slide-up, 200ms ease-out
- Button press: `whileTap={{ scale: 0.97 }}`, 100ms
- Counter change: number morph with AnimatePresence, 300ms
- Page load: stagger fade-in (hero → title → button), 150ms delays
- Copy link: "Copied!" toast, auto-dismiss 2s

### Accessibility

- Focus-visible rings: 2px accent blue, 2px offset
- Touch targets >= 48px
- Contrast: accent blue on white = 4.6:1, muted gray on off-white = 4.9:1 (AA)
- Respects `prefers-reduced-motion`

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| Next.js 16 | App Router, SSR, API routes |
| Prisma 6 | ORM, schema, migrations |
| metascraper + rules | OG metadata extraction |
| bullmq | Job queue |
| ioredis | Redis client for BullMQ |
| nanoid | Token generation (base62, 22 chars) |
| motion | Animations (import from `motion/react`) |
| clsx + tailwind-merge | Class utilities |
| lucide-react | Icons |
| Tailwind CSS 4 | Styling |

---

## Project Structure

```
shareal-ink/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── api/
│   │   ├── og/
│   │   │   ├── route.ts
│   │   │   └── [jobId]/route.ts
│   │   └── spaces/
│   │       ├── route.ts
│   │       └── [token]/
│   │           ├── route.ts
│   │           └── respond/route.ts
│   └── [token]/
│       └── page.tsx
├── components/
│   ├── ui/           (Button, Input, Skeleton, TypeBadge)
│   ├── create/       (CreateForm, LinkPreview)
│   ├── surface/      (SurfaceCard, ActionButton, HeroImage, ResponseCounter, SecondaryActions)
│   └── layout/       (Logo)
├── lib/
│   ├── interfaces/   (IOgFetcher, IQueue, IAuthProvider, IAnalytics, IRateLimiter, ILinkDetector, IImageStore)
│   ├── adapters/     (MetascraperOgFetcher, BullMQAdapter, NoopAuth, NoopAnalytics, InMemoryRateLimiter, RegexLinkDetector, PassthroughImageStore)
│   ├── container.ts  (wiring — single import point)
│   ├── utils.ts      (cn helper)
│   ├── tokens.ts     (nanoid base62)
│   ├── prisma.ts     (singleton client)
│   ├── redis.ts      (ioredis connection)
│   ├── worker.ts     (BullMQ worker init)
│   └── types.ts      (shared TS types)
├── prisma/
│   └── schema.prisma
├── public/
├── .env.example
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Verification Criteria

1. `bun run build` compiles without errors
2. Paste a Google Maps URL → see progressive preview → create → surface with "I'm in!"
3. Paste a YouTube URL → type badge "Video" → "I'll watch it" button
4. Type free text "Pizza tonight?" → creates surface with text as title, no image
5. Type gibberish → still works, generic surface
6. Click "Create" before OG loads → space created, OG enriches later
7. Open surface → click action → count increments → button changes to responded state
8. Revisit surface → localStorage shows already-responded state
9. View page source → og:title, og:image meta tags present
10. Rate limit: 21st request in 1 minute → 429 response
