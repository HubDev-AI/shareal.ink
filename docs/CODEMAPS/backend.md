<!-- Generated: 2026-02-22 | Files scanned: ~25 | Token estimate: ~500 -->
# Backend

## API Routes
```
POST /api/og              → validate input → detect link type → create OgJob → enqueue BullMQ
GET  /api/og/[jobId]      → poll OgJob status (processing/completed/failed)
POST /api/spaces          → validate → merge OG data → generate 7-char token → create Space
GET  /api/spaces/[token]  → fetch Space + yes count
POST /api/spaces/[token]/respond → record yes/no → return counts (rate-limited per IP+token)
GET  /api/health          → DB SELECT 1 + Redis URL check → ok/degraded
```

## Key Files
```
app/api/og/route.ts                    (73 lines) — OG fetch initiation
app/api/og/[jobId]/route.ts            (40 lines) — OG job polling
app/api/spaces/route.ts                (125 lines) — Space creation
app/api/spaces/[token]/route.ts        (49 lines) — Space retrieval
app/api/spaces/[token]/respond/route.ts (47 lines) — Response recording
app/api/health/route.ts                (32 lines) — Health check
```

## Worker (standalone process)
```
worker/index.ts   (170 lines) — BullMQ worker, concurrency 5, processes og-fetch queue
worker/health.ts  (53 lines)  — HTTP health endpoint on :8080
worker/logger.ts  (48 lines)  — Structured JSON logger
```
Worker uses own pg Pool (not Next.js Prisma). Graceful shutdown with 30s drain.
Uses MetascraperOgFetcher + site-extractors for per-domain metadata enhancement.

## Rate Limiting
- Default: 10 req/min (configurable via RATE_LIMIT_MAX)
- Respond endpoint: 30 req/min (per IP+token)
- Auto-selects Upstash (prod) or InMemory (dev)

## Security
- SSRF protection: `isUrlSafe()` blocks private IPs, localhost, non-http
- XSS protection: `sanitizeHref()` for user-provided URLs
- CSP headers in next.config.ts (frame-src whitelist for embeds)
