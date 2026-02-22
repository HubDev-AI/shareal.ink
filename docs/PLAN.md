# shareal.ink MVP Implementation Plan

## Context

**What**: Build the shareal.ink MVP - "One link = One beautiful surface." Turn any shared link into a clean, structured planning surface with a primary action (RSVP). Initial wedge: restaurant/meetup planning.

**Why**: Validate whether users prefer sharing a structured link instead of a raw URL, and whether it reduces coordination friction.

**Current state**: No existing project. Building from scratch at `shareal-ink/` in the worktree root. Domain `shareal.ink` is owned and ready.

**Hosting strategy**: Vercel for the Next.js app (native platform, great for SSR/OG) + Railway for PostgreSQL. When mobile apps come later, Next.js API routes serve as the REST backend. If they outgrow Vercel serverless limits, split API to Railway then.

**Key constraint**: MVP experiment. No auth, no dashboards, no complex features.

---

## Package Versions (latest, verified via Context7)

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.x | App Router. `params` is `Promise<>` in route handlers/pages. |
| Prisma | 6.x | Schema syntax unchanged. `@prisma/client` 6.x. |
| Motion | `motion` | **Not `framer-motion`**. Import from `motion/react`. Same API (`whileTap`, `AnimatePresence`). |
| nanoid | latest | Custom alphabet support for base62 tokens. |
| Tailwind CSS | 4.x | v4 uses CSS-based config by default. |

**Package manager**: `bun` throughout (not npm/pnpm).

---

## Phase 1: Project Scaffolding

### 1.1 Initialize Next.js project
```bash
bun create next-app shareal-ink --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*" --turbopack
```

### 1.2 Install dependencies
```bash
cd shareal-ink
bun add prisma @prisma/client nanoid motion clsx tailwind-merge lucide-react
```

### 1.3 Configure design system
- **Tailwind config**: Custom colors (background `#FAFAF8`, accent blue `#2563eb`, muted gray `#6b7280`), border radius (`12px`/`16px`), max-width `720px`, Inter font
- **`app/globals.css`**: CSS variables, body styles, focus ring utility
- **`lib/utils.ts`**: `cn()` helper (clsx + tailwind-merge)

### 1.4 Environment & config
- **`.env.example`**: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL=https://shareal.ink`, rate limit vars
- **`next.config.ts`**: Allow all remote image domains (MVP — needed for arbitrary OG images)

---

## Phase 2: Database

### 2.1 Prisma schema (`prisma/schema.prisma`)

**Space model**:
- `id` (cuid, internal PK)
- `token` (varchar 22, unique — URL-facing identifier)
- `originalUrl`, `title`, `description?`, `imageUrl?`
- `linkType` (enum: restaurant | generic)
- `intentType` (enum: meet | vote | share)
- `intentText?`, `primaryActionLabel`
- `createdAt`, `expiresAt?`, `creatorUserId?`

**Response model**:
- `id` (cuid), `spaceId` (FK → Space), `responseType` (enum: yes | no), `createdAt`
- Index on `spaceId`, cascade delete

Snake_case DB columns via `@map()`, camelCase in Prisma models.

### 2.2 Database setup
- **Local dev**: Docker `postgres:16-alpine` on port 5432
- **Production**: Railway PostgreSQL
- **`lib/prisma.ts`**: Singleton client pattern (avoid connection exhaustion on hot reload)
- Run `bunx prisma migrate dev --name init`

---

## Phase 3: Core Libraries & API Routes

### 3.1 Libraries (independent — can build in parallel)

| File | Purpose |
|------|---------|
| `lib/tokens.ts` | `createSpaceToken()` — nanoid with base62 alphabet, 22 chars (~131 bits entropy) |
| `lib/og-fetcher.ts` | `fetchOGMetadata(url)` — fetch HTML, regex-extract og:title/description/image. 8s timeout. Custom User-Agent. Google Maps URL fallback: extract place name from path. |
| `lib/link-detector.ts` | `detectLinkType(url)` — pattern match Google Maps, Yelp, OpenTable, Resy, etc. Returns linkType + suggested intent + action label |
| `lib/rate-limit.ts` | In-memory sliding window rate limiter (20 req/min per IP). MVP single-instance. |
| `lib/types.ts` | Shared TypeScript interfaces for API request/response shapes |

### 3.2 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `app/api/og/route.ts` | POST | Fetch OG metadata + detect link type for a URL. Powers the create form preview. |
| `app/api/spaces/route.ts` | POST | Create space: validate URL, fetch OG, detect type, generate token, insert DB. Returns `{ token, url }`. |
| `app/api/spaces/[token]/route.ts` | GET | Fetch space data + response count as JSON. |
| `app/api/spaces/[token]/respond/route.ts` | POST | Record yes/no response. Returns updated count. |

All mutation routes include IP-based rate limiting.

---

## Phase 4: UI

### 4.1 Root layout (`app/layout.tsx`)
- Inter font via `next/font/google`
- Site-wide metadata (title: "shareal.ink", description)
- Off-white background, antialiased text

### 4.2 Homepage (`app/page.tsx`)
- Minimal: Logo/wordmark + "Share a link. Make it make sense." + `<CreateForm />`
- Centered, single column, vertically centered

### 4.3 CreateForm (`components/create/CreateForm.tsx`) — client component
- State machine: `idle` → `fetching` → `previewing` → `creating` → `created`
- Paste URL input → calls `POST /api/og` → shows `<LinkPreview />` with editable title/intent → calls `POST /api/spaces` → redirects to `/{token}`

### 4.4 LinkPreview (`components/create/LinkPreview.tsx`) — client component
- OG image preview, title (editable), description, detected type badge ("Restaurant" / "Generic")
- Intent selector (meet/vote/share), editable action label

### 4.5 Surface page (`app/[token]/page.tsx`) — server component
- Direct Prisma query (server component, no API call needed)
- `generateMetadata()` for dynamic OG tags — **critical for WhatsApp/Discord/iMessage previews**
- `params` is `Promise<{ token: string }>` (Next.js 16 pattern)
- Renders `<SurfaceCard />`

### 4.6 Surface components

| Component | Type | Purpose |
|-----------|------|---------|
| `SurfaceCard.tsx` | Server | Main card: hero, title, description, intent, actions |
| `HeroImage.tsx` | Client | `next/image` with gradient fallback on error |
| `ActionButton.tsx` | Client | Full-width primary "I'm in!" button. POST to respond API, optimistic count update, localStorage to prevent re-click |
| `ResponseCounter.tsx` | Client | "N people are in" with animated number transition |
| `SecondaryActions.tsx` | Client | Open in Maps, Copy link, Share (Web Share API) |

### 4.7 Other pages
- `app/not-found.tsx` — Custom 404 matching the aesthetic
- `app/loading.tsx` — Global loading skeleton

---

## Phase 5: Polish

- **Animations**: Motion (`motion/react`) fade-in on page load, `whileTap` on buttons, `AnimatePresence` on count changes. All ≤300ms.
- **Error states**: Invalid URL inline error, OG fetch failure fallback (use URL hostname as title), 404 page, rate limit toast
- **Loading states**: Skeleton pulse for OG preview, button loading spinner, surface page skeleton
- **Response dedup**: localStorage tracks which spaces the user has responded to (client-side only, not bulletproof but sufficient for MVP)
- **Responsive**: Single-column max-720px. Touch targets ≥44px.

---

## Project Structure

```
shareal-ink/
├── app/
│   ├── globals.css
│   ├── layout.tsx              # Root layout (Inter font, metadata, bg)
│   ├── page.tsx                # Homepage
│   ├── loading.tsx             # Global loading skeleton
│   ├── not-found.tsx           # Custom 404
│   ├── api/
│   │   ├── og/route.ts         # OG metadata fetching
│   │   └── spaces/
│   │       ├── route.ts        # POST: create space
│   │       └── [token]/
│   │           ├── route.ts    # GET: fetch space
│   │           └── respond/
│   │               └── route.ts # POST: record response
│   └── [token]/
│       └── page.tsx            # Surface view (SSR + dynamic OG)
├── components/
│   ├── ui/                     # button, input, badge, skeleton
│   ├── create/                 # CreateForm, LinkPreview
│   ├── surface/                # SurfaceCard, ActionButton, HeroImage, etc.
│   └── layout/                 # Logo, Footer
├── lib/
│   ├── utils.ts                # cn() helper
│   ├── tokens.ts               # Token generation
│   ├── og-fetcher.ts           # OG metadata extraction
│   ├── link-detector.ts        # Link type detection
│   ├── rate-limit.ts           # Rate limiting
│   ├── prisma.ts               # Prisma client singleton
│   └── types.ts                # Shared types
├── prisma/
│   └── schema.prisma
├── public/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Critical Files

1. `prisma/schema.prisma` — Data model (Space + Response)
2. `app/[token]/page.tsx` — Surface view with SSR + dynamic OG metadata generation
3. `app/api/spaces/route.ts` — Space creation API (URL validation, OG fetch, token gen, DB insert)
4. `components/create/CreateForm.tsx` — Homepage creation flow state machine
5. `lib/og-fetcher.ts` — OG metadata extraction service

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager | bun | User preference. Faster installs and runtime. |
| Token | nanoid base62, 22 chars (>128 bits) | Crypto-random, URL-safe, not guessable |
| OG fetching | Custom regex extractor (zero extra deps) | Lightweight. Upgrade to `open-graph-scraper` if edge cases arise. |
| Motion library | `motion` (import from `motion/react`) | Latest version of Framer Motion, rebranded. |
| Rate limiting | In-memory Map | Single-instance MVP. Replace with Upstash Redis for production. |
| Auth | None (MVP) | Surfaces created/responded anonymously. Auth added later for edit/manage. |
| UI components | Hand-built (~5 components) | No shadcn init overhead. Can add later. |
| Hosting | Vercel (app) + Railway (PostgreSQL) | Best of both. Vercel native Next.js + Railway managed DB. |
| Domain | shareal.ink (owned) | Production URL: `https://shareal.ink/{token}` |

## Verification

1. `bun run build` — compiles without errors
2. `bun run dev` — start dev server
3. Paste a Google Maps restaurant URL on homepage → see preview with "Restaurant" badge → create → redirected to surface
4. Open surface URL → hero image, title, intent, "I'm in" button
5. Click "I'm in" → count increments, button changes to "You're in!"
6. View page source for `og:title`, `og:image` meta tags
7. Test OG preview at https://www.opengraph.xyz/ with a surface URL
