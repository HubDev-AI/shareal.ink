# shareal.ink

> One link = One beautiful surface.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL via Prisma 7.4.1
- **Queue**: BullMQ 5.70.0 + Redis (Upstash in prod)
- **OG Scraping**: metascraper 5.49.24
- **Styling**: Tailwind CSS 4, custom design tokens in globals.css
- **Animations**: Motion 12.34.3 (import from `motion/react`)
- **Package Manager**: bun (always use bun, never npm/yarn/pnpm)
- **Testing**: Vitest 4.0.18

## Commands
```bash
bun install          # Install deps
bun run dev          # Dev server (localhost:3000)
bun run build        # Production build
bun run test         # Run all tests (25 tests, 4 files)
bunx prisma generate # Regenerate Prisma client after schema changes
bunx prisma migrate dev --name <name>  # Create + apply migration
```

## Architecture

### Adapter Pattern
Every external dependency has an interface (`lib/interfaces/`) and adapter (`lib/adapters/`), wired in `lib/container.ts`. To swap an implementation, change one line in container.ts.

| Interface | Current Adapter | Purpose |
|-----------|----------------|---------|
| IOgFetcher | MetascraperOgFetcher | OG metadata extraction |
| IQueue | BullMQAdapter | Async job queue |
| IAuthProvider | NoopAuthProvider | Auth (noop for MVP) |
| IAnalytics | NoopAnalytics / PlausibleAnalytics | Analytics (auto: PLAUSIBLE_DOMAIN) |
| IRateLimiter | RedisRateLimiter / InMemoryRateLimiter | Rate limiting (auto: REDIS_URL) |
| ILinkDetector | RegexLinkDetector | Link type detection |
| IImageStore | PassthroughImageStore | Image storage (noop for MVP) |

### Key Files
- `lib/container.ts` — Central dependency wiring
- `lib/types.ts` — Shared TypeScript types
- `lib/prisma.ts` — Lazy PrismaClient singleton (Proxy-based, avoids build-time init)
- `lib/worker.ts` — Legacy in-process BullMQ worker (used by Next.js dev)
- `worker/index.ts` — Standalone BullMQ worker process (Docker/Railway). MUST use `MetascraperOgFetcher` adapter — never inline OG scraping logic.
- `prisma/schema.prisma` — Data models (Space, Response, OgJob)
- `prisma.config.ts` — Prisma 7 config (datasource URL)

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/og` | POST | Parse input, detect link type, enqueue OG fetch |
| `/api/og/[jobId]` | GET | Poll OG job status |
| `/api/spaces` | POST | Create space with metadata |
| `/api/spaces/[token]` | GET | Fetch space data + response count |
| `/api/spaces/[token]/respond` | POST | Record yes/no response |

### Pages
| Route | Type | Purpose |
|-------|------|---------|
| `/` | Static | Homepage with CreateForm |
| `/[token]` | SSR | Surface page with dynamic OG meta |
| `/not-found` | Static | Custom 404 |

### Renderers (COUPLED — always update both together)
Each link type has TWO renderers that must stay in sync:
- **Surface renderers** (`components/surface/renderers/`) — full interactive cards on `/[token]` pages
- **Preview renderers** (`components/create/preview-renderers/`) — lightweight previews on homepage create form

When changing image constraints, text truncation, layout, or adding a new link type, **update both renderer sets**. Preview renderers use static images (no iframes), surface renderers use full interactive embeds.

### CSP (Content-Security-Policy)
Defined in `next.config.ts`. When adding iframe embeds, add BOTH the direct domain AND any redirect targets to `frame-src`. Example: Google Maps embeds at `maps.google.com` redirect to `www.google.com` — both must be in the CSP.

### Worker (standalone process)
`worker/index.ts` runs as a separate bun process outside Next.js. It uses `@/` imports (bun resolves tsconfig paths). It MUST use the shared `MetascraperOgFetcher` adapter to get site-specific extractors (coords, videoId, embedUrl, etc.) and write `extras` to both OgJob and Space records.

## Prisma 7 Gotchas
- `url` is NOT in `schema.prisma` — it's in `prisma.config.ts`
- PrismaClient uses Proxy lazy-init to avoid build-time connection errors
- After schema changes: `bunx prisma generate` then `bunx prisma migrate dev`

## Environment
```env
# Required
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shareal_ink?schema=public"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional (production)
PLAUSIBLE_DOMAIN=shareal.ink          # Activates PlausibleAnalytics adapter
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

## Git Workflow
- **Repo**: https://github.com/HubDev-AI/shareal.ink
- **main**: Production branch (protected)
- **dev**: Default branch for PRs (protected)
- Both branches: no direct push, no force push, no deletion — PRs only
- Create feature branches from dev, PR into dev, PR dev into main for releases

## Docs
- `docs/plans/2026-02-21-shareal-ink-design.md` — Full design document
- `docs/plans/2026-02-21-shareal-ink-implementation.md` — 12-task implementation plan
- `PLAN.md` — High-level plan overview

## What's Next (Post-MVP)
- Authentication (swap NoopAuthProvider)
- Space expiration
- Vote/share intent types
- Admin dashboard
- Image upload (swap PassthroughImageStore)
