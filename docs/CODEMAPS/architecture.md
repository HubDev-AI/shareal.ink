<!-- Generated: 2026-02-22 | Files scanned: ~120 | Token estimate: ~600 -->
# Architecture

## System Diagram
```
Browser ──POST /api/og──► Next.js API ──enqueue──► Redis (BullMQ)
  │                          │                         │
  │◄─── poll /api/og/[id] ──┘                         ▼
  │                                              Worker (standalone bun)
  │                                                │
  │──POST /api/spaces──► Next.js API               │── MetascraperOgFetcher
  │                          │                      │── site-extractors (YouTube, Maps, etc.)
  │◄── { token, url } ──────┘                      │
  │                                                 ▼
  │──GET /[token]──► SSR Page                   PostgreSQL
  │                    │                        (OgJob + Space updated)
  │◄── SurfaceCard ───┘
```

## Service Boundaries
- **Next.js App** (Vercel): pages + API routes + SSR
- **BullMQ Worker** (standalone bun process, Railway): OG scraping jobs
- **PostgreSQL** (Railway): spaces, responses, og_jobs
- **Redis** (Upstash): BullMQ job queue + rate limiting

## Data Flow: Create Space
1. User pastes URL → `POST /api/og` → RegexLinkDetector classifies link type
2. OgJob created in DB (status: processing), job enqueued to BullMQ
3. Frontend polls `GET /api/og/[jobId]` until completed
4. Worker fetches OG metadata via MetascraperOgFetcher + site-extractors
5. Worker updates OgJob + Space with title, description, imageUrl, extras
6. User submits → `POST /api/spaces` → creates Space, returns 7-char token
7. Redirect to `/[token]` → SSR renders SurfaceCard with type-specific renderer

## Adapter Pattern
All external deps behind interfaces in `lib/interfaces/`, wired in `lib/container.ts`:
- IOgFetcher → MetascraperOgFetcher
- IQueue → BullMQAdapter
- IRateLimiter → InMemory or Upstash (auto-detected)
- IAnalytics → Noop or Plausible (auto-detected)
- IAuthProvider → NoopAuthProvider
- ILinkDetector → RegexLinkDetector
- IImageStore → PassthroughImageStore
