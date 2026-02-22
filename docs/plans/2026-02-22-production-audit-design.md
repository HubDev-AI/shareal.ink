# Production Audit: shareal.ink

**Date:** 2026-02-22
**Scope:** Full production readiness — security, code quality, ops/infra
**Method:** Parallel agent swarm (security auditor, code reviewer, ops/infra architect)
**Branch:** `dev` (commit `a14b904`)

---

## CRITICAL — Must Fix Before Deploy

### C1. SSRF in OG Fetcher

**Location:** `lib/adapters/metascraper-og-fetcher.ts:20`

`fetch(url)` on any user-submitted URL with no host validation. Can reach cloud metadata (`169.254.169.254`), internal services, Redis, PostgreSQL, localhost.

**Fix:** Validate hostname against private/reserved IP ranges before fetching. Also resolve DNS and check the resolved IP to prevent DNS rebinding (`evil.com` → `127.0.0.1`).

### C2. BullMQ Worker Inside Vercel Serverless

**Location:** `app/api/og/route.ts:10`, `lib/worker.ts`

`getWorker()` called from API route starts a long-lived BullMQ Worker inside an ephemeral serverless function. Worker will be killed mid-job on function freeze, connections leak, jobs partially processed.

**Fix:** Remove `getWorker()` from the API route. The route should only enqueue jobs. Deploy the worker as a separate long-running process on Railway.

### C3. Worker Deployment Entrypoint Doesn't Exist

**Location:** `docs/DEPLOY.md:59-68`

DEPLOY.md references `lib/worker.js` which is never built. The worker code uses `@/` path aliases and is only available as a Next.js server module.

**Fix:** Create a standalone worker entry point (e.g., `worker/index.ts`) that can be compiled and run independently on Railway via `tsx` or `tsup`.

### C4. Worker Doesn't Handle Fetch Failures

**Location:** `lib/worker.ts:18-34`

If `fetcher.fetch(url)` throws (network timeout, DNS failure), the exception propagates to BullMQ but `prisma.ogJob.update` never executes. OgJob stays in `status: "processing"` forever. Frontend polls indefinitely.

**Fix:** Wrap the processor in try/catch. On catch, update OgJob to `status: "failed"` with error message, then re-throw so BullMQ records the failure.

### C5. No Error Boundary

**Location:** `app/` (missing `error.tsx` and `global-error.tsx`)

Any unhandled runtime error (DB timeout, malformed data) shows a blank white page with generic Next.js error message. No recovery path for users.

**Fix:** Create `app/error.tsx` (client component with reset callback) and `app/global-error.tsx`. Provide branded error state with retry button and link home.

### C6. `javascript:` URI Stored XSS

**Location:** `app/api/spaces/route.ts:51`, multiple renderers

`/api/spaces` accepts `url` field without protocol validation. A `javascript:alert(document.cookie)` URL gets stored in DB and rendered as clickable `<a href>` across surface page components (hero-image, secondary-actions, truncated-text, pdf-renderer).

**Fix:** Validate `url` protocol in `/api/spaces` POST — only allow `http:` and `https:`. Add a `sanitizeHref()` utility for all components rendering user-supplied URLs.

---

## HIGH — Should Fix Before Deploy

### H1. Missing Input Validation on `/api/spaces`

**Location:** `app/api/spaces/route.ts:21-58`

No length limits on title, description, intentText, primaryActionLabel. No enum validation for linkType/intentType — invalid values cause Prisma 500 instead of 400. Attacker can store megabytes of text per space.

**Fix:** Validate enum values against allowlists. Add length limits: title (256), description (2000), intentText (500), primaryActionLabel (100).

### H2. No Security Headers

**Location:** `next.config.ts` (missing `headers` config), no `middleware.ts`

Missing CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. App can be iframed (clickjacking). No defense-in-depth against XSS.

**Fix:** Add `headers()` to `next.config.ts` with X-Frame-Options: DENY, HSTS, nosniff, CSP with allowlisted frame-src for YouTube/Spotify/Instagram/TikTok/Maps.

### H3. Open Image Proxy

**Location:** `next.config.ts:6-9`

`hostname: "**"` allows `/_next/image` to proxy any URL. All `<Image>` components already use `unoptimized`, so the optimization proxy is unused but exposed.

**Fix:** Set `images: { unoptimized: true }` globally and remove `remotePatterns`, or restrict to known CDN hostnames.

### H4. Rate Limiter IP Spoofing

**Location:** `app/api/og/route.ts:11`, `app/api/spaces/route.ts:7`, `app/api/spaces/[token]/respond/route.ts:10`

Uses raw `x-forwarded-for` header as rate limit key — full string including proxy chain, spoofable. When absent, all users share key `"unknown"`.

**Fix:** Use `x-real-ip` on Vercel (not spoofable), or parse first IP from `x-forwarded-for`. Extract to shared `getClientIp()` helper.

### H5. Unvalidated Iframe URLs from Extras

**Location:** `components/surface/renderers/spotify-renderer.tsx:8`, youtube/instagram/tiktok renderers

Spotify renderer uses `extras.embedUrl` directly as iframe `src` without domain validation. Other renderers interpolate extras (videoId, shortcode) into embed URLs. If extras data is ever corrupted or injected, arbitrary iframes load.

**Fix:** Validate iframe source URLs against allowlisted domains in each renderer (spotify → `open.spotify.com`, youtube → `www.youtube.com`, etc.).

### H6. OG Polling Has No Timeout

**Location:** `components/create/create-form.tsx:55-77`

`setInterval` polls every 1.5s with no max count. If job stalls (C4), polling continues indefinitely.

**Fix:** Add `MAX_POLLS = 20` (~30s). After limit, stop polling and transition to "previewing" state, allowing user to proceed without OG metadata.

### H7. DB Pool Unconfigured for Serverless

**Location:** `lib/prisma.ts:13`

`pg.Pool` created with defaults (`max: 10`). Each Vercel cold start creates a new pool. Can exhaust Railway connection limits under load.

**Fix:** Set `max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000`.

### H8. Missing try/catch in 3 API Routes

**Location:** `app/api/spaces/[token]/route.ts`, `app/api/spaces/[token]/respond/route.ts`, `app/api/og/[jobId]/route.ts`

No error handling around Prisma calls. DB failure returns raw 500 with no structured error body.

**Fix:** Add try/catch returning `{ error: "Internal server error" }` with status 500. Consider a shared `withErrorHandler` wrapper.

### H9. Duplicate DB Query on Surface Page

**Location:** `app/[token]/page.tsx:20` and `:48`

`generateMetadata` and page component both call `prisma.space.findUnique`. Next.js does not deduplicate Prisma queries (only `fetch`). Every surface page visit = 2 DB round-trips.

**Fix:** Use `React.cache()` to memoize the space lookup within a single request.

### H10. Missing Database Indexes

**Location:** `prisma/schema.prisma`

No index on `Space.ogJobId` (used by worker `updateMany`). No index on `OgJob.status` or `OgJob.createdAt` for cleanup queries.

**Fix:** Add `@@index([ogJobId])` on Space, `@@index([status, createdAt])` on OgJob.

---

## MEDIUM — Fix Soon After Deploy

### M1. No Error Tracking

Only 2 `console.error` statements in entire codebase. No Sentry, no structured error reporting.

**Fix:** Add `@sentry/nextjs` with automatic error capture. Free tier handles MVP scale.

### M2. No Health Check Endpoint

No `/api/health` to verify DB/Redis connectivity. Uptime monitoring has nothing to ping.

**Fix:** Add `/api/health/route.ts` that runs `prisma.$queryRaw\`SELECT 1\`` and returns status.

### M3. No OgJob Cleanup / Data Retention

`expiresAt` field on Space exists but is never used. OgJobs accumulate forever.

**Fix:** Add Vercel Cron Job to delete completed OgJobs older than 24h. Plan Space expiration using existing `expiresAt` field.

### M4. InMemoryRateLimiter Silent Fallback

If `UPSTASH_REDIS_REST_URL` is missing in prod, falls back silently to per-instance in-memory limiter — effectively no rate limiting across Vercel functions.

**Fix:** Log a warning in production when falling back to InMemoryRateLimiter.

### M5. No CSRF Protection

POST endpoints accept from any origin. JSON parsing provides natural protection (forms can't submit JSON), but no explicit Origin validation.

**Fix:** Add Origin header validation in middleware for POST requests. Low risk for MVP since there's no auth.

### M6. InMemoryRateLimiter Memory Leak

Expired entries never cleaned from Map. OOM over time if used as active adapter.

**Fix:** Add periodic cleanup interval that purges entries older than `windowMs`.

### M7. No Graceful Worker Shutdown

No SIGTERM/SIGINT handler. In-flight jobs interrupted on Railway deploys.

**Fix:** Add `process.on("SIGTERM", () => worker.close())` to worker entry point.

### M8. Redis Failure Blocks Space Creation

If Redis is down, `queue.enqueue()` throws and entire create flow fails, even though DB writes could succeed.

**Fix:** Wrap `queue.enqueue()` in try/catch. If it fails, log the error and continue — space is created without OG metadata.

### M9. No Server-Side Vote Dedup

Dedup relies on localStorage only. curl/incognito bypasses it. Rate limiter allows ~20-30 votes/min per IP.

**Fix:** Post-MVP: add IP-hash-based dedup at DB level. For now, acceptable.

### M10. Plausible Errors Silently Swallowed

`.catch(() => {})` means broken analytics goes unnoticed.

**Fix:** Log failures in development: `console.warn("[plausible]", err.message)`.

---

## LOW — Future / Nice to Have

| # | Finding |
|---|---------|
| L1 | Silent error swallowing in client components (empty catch blocks) |
| L2 | No structured logging (no request IDs, no correlation) |
| L3 | No `sandbox` attribute on third-party iframes |
| L4 | Enumerable OgJob CUIDs (time-sortable, minor info disclosure) |
| L5 | `as` type casts bypass Prisma enum safety |
| L6 | Missing test coverage for API routes, worker, site extractors |
| L7 | SEO test tests a literal copy, not actual source object |
| L8 | `extras` field cast as `Record<string, string>` without runtime validation |
| L9 | Vote replay protection (unlimited anonymous votes within rate limit) |
| L10 | No backup strategy documented |

---

## Architecture Strengths

- Adapter pattern well-implemented with clean interfaces and container wiring
- Proxy-based lazy Prisma init avoids build-time side effects
- `parseInput()` discriminated union is clean and well-tested (9 tests)
- Renderer registry pattern is extensible — add link type = add component
- Rate limiting applied consistently to all write endpoints
- No SQL injection risk — all Prisma, zero raw queries
- No `dangerouslySetInnerHTML` with user data (JSON-LD is static)
- `.env` properly gitignored, no secrets in tracked files

---

## Recommended Fix Order

1. **C1-C6** — all criticals (SSRF, worker architecture, XSS, error boundary)
2. **H1-H4** — input validation, security headers, image proxy, IP spoofing
3. **H5-H10** — iframe validation, polling timeout, DB pool, error handling, indexes
4. **Deploy** and validate
5. **M1-M4** — Sentry, health check, cleanup, fallback warning (first week)
6. **M5-M10** — CSRF, memory leak, graceful shutdown, Redis fallback (first two weeks)
7. **L1-L10** — ongoing maintenance
