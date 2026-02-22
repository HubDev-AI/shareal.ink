# Production Readiness v2: CI/CD, Monitoring, Versioning, Security Hardening

**Date:** 2026-02-22
**Target:** Railway (app + worker services)
**Branch:** `dev` (commit `28b11cf`)

---

## Context

Audit of the codebase on `dev` found 4 HIGH-risk and 4 MEDIUM-risk gaps. This design addresses all of them in a single sweep before the first production deploy.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Error tracking | Sentry | Free tier (5K errors/mo), best Next.js integration |
| Versioning | release-please | Creates Release PRs with CHANGELOG, manual merge trigger |
| Dependency scanning | Dependabot | Zero config, native GitHub integration |
| Approach | Fix everything | No rush timeline, all changes are independent |

---

## 1. CI/CD Pipeline

**File:** `.github/workflows/ci.yml`
**Trigger:** PRs to `dev` and `main`

Three parallel jobs:

### 1a. lint-and-typecheck
- `bun install --frozen-lockfile`
- `bun run build` (runs TypeScript via Turbopack)

### 1b. unit-tests
- `bun install --frozen-lockfile`
- `bun run test`

### 1c. e2e-tests (depends on unit-tests)
- `bun install --frozen-lockfile`
- `bunx playwright install --with-deps chromium`
- `bun run build && bun run start` (background)
- `bunx playwright test`

**Service containers:** PostgreSQL 16 + Redis 7 (for Prisma generate and E2E tests).

After landing, enable "Require status checks to pass" on dev and main in GitHub settings.

---

## 2. Reproducible Builds

- Remove `bun.lock` from `.gitignore`
- Run `bun install` to generate lockfile
- Commit `bun.lock`

This makes `--frozen-lockfile` work in Dockerfile and CI.

---

## 3. Dependency Scanning

**File:** `.github/dependabot.yml`

- Weekly security updates for npm ecosystem
- Grouped updates: patches together, minors together
- Auto-opens PRs when transitive dependency vulnerabilities are found

---

## 4. Sentry Error Tracking

**Install:** `@sentry/nextjs`

**Files created:**
- `sentry.client.config.ts` — client SDK init
- `sentry.server.config.ts` — server SDK init
- `sentry.edge.config.ts` — edge runtime init
- `instrumentation.ts` — Next.js instrumentation hook

**Files modified:**
- `next.config.ts` — wrap with `withSentryConfig()` for source maps
- `app/global-error.tsx` — add `Sentry.captureException(error)`
- `app/error.tsx` — add `Sentry.captureException(error)`

**Env vars:**
- `SENTRY_DSN` (optional — no-op when unset, same pattern as Plausible)
- `SENTRY_AUTH_TOKEN` (CI only — for source map uploads)

**What gets captured:** Unhandled exceptions, API 500s, React rendering errors. No PII.

---

## 5. Environment Validation

**File:** `lib/env.ts`

Validates all required env vars at startup (not lazily on first request).

**Required (throws on missing):**
- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_APP_URL` (currently hardcoded fallback — centralize here)

**Optional (typed exports with defaults):**
- `SENTRY_DSN`
- `PLAUSIBLE_DOMAIN` / `PLAUSIBLE_API_URL`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `RATE_LIMIT_MAX` (default: 20)
- `RATE_LIMIT_WINDOW_MS` (default: 60000)
- `LOG_LEVEL` (default: "info")

**Integration:** Imported in `app/layout.tsx` (runs on startup) and `worker/index.ts`. Existing `lib/prisma.ts` and `lib/redis.ts` import from `lib/env.ts` instead of reading `process.env` directly.

---

## 6. Semantic Versioning (release-please)

**File:** `.github/workflows/release.yml`
**Trigger:** Push to `main`

**How it works:**
1. release-please reads conventional commits (feat:, fix:, chore:, etc.)
2. Creates/updates a Release PR that bumps `package.json` version + generates `CHANGELOG.md`
3. Merging the Release PR creates a GitHub Release with git tag (v0.2.0, etc.)

**Config files:**
- `.release-please-manifest.json` — tracks current version
- `release-please-config.json` — package type, changelog sections

**Release workflow:** Feature branches -> dev -> main -> release-please PR -> merge -> tagged release.

---

## 7. Security Hardening

### 7a. CSP: Remove unsafe-eval in production
**File:** `next.config.ts`

Split CSP `script-src` by environment:
- Development: includes `'unsafe-eval'` (needed for hot-reload)
- Production: removes `'unsafe-eval'`

### 7b. Rate limiting on GET endpoints
**Files:** `app/api/spaces/[token]/route.ts`, `app/api/og/[jobId]/route.ts`

Add rate limiting with higher thresholds than write endpoints:
- GET endpoints: 60 req/min per IP
- Existing POST endpoints: 20 req/min per IP (unchanged)

### 7c. Health check: Add Redis
**File:** `app/api/health/route.ts`

Add Redis connectivity check alongside existing DB check. If Redis is down, OG job enqueueing fails — health should reflect that.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | NEW — CI pipeline |
| `.github/workflows/release.yml` | NEW — release-please |
| `.github/dependabot.yml` | NEW — dependency scanning |
| `.gitignore` | Remove bun.lock exclusion |
| `bun.lock` | NEW — committed lockfile |
| `sentry.client.config.ts` | NEW — Sentry client init |
| `sentry.server.config.ts` | NEW — Sentry server init |
| `sentry.edge.config.ts` | NEW — Sentry edge init |
| `instrumentation.ts` | NEW — Next.js instrumentation |
| `.release-please-manifest.json` | NEW — version tracking |
| `release-please-config.json` | NEW — release config |
| `lib/env.ts` | NEW — startup env validation |
| `next.config.ts` | Sentry wrapper + CSP split |
| `app/global-error.tsx` | Add Sentry.captureException |
| `app/error.tsx` | Add Sentry.captureException |
| `app/api/health/route.ts` | Add Redis check |
| `app/api/spaces/[token]/route.ts` | Add GET rate limiting |
| `app/api/og/[jobId]/route.ts` | Add GET rate limiting |
| `lib/prisma.ts` | Import from lib/env.ts |
| `lib/redis.ts` | Import from lib/env.ts |
| `worker/index.ts` | Import from lib/env.ts |
| `.env.example` | Add SENTRY_DSN, SENTRY_AUTH_TOKEN |
| `package.json` | Add @sentry/nextjs dependency |

---

## Verification

1. `bun run test` — all unit tests pass
2. `bun run build` — production build clean
3. CI workflow runs successfully on a test PR
4. Sentry test event received in dashboard
5. `GET /api/health` reports both DB and Redis status
6. Missing env var at startup crashes immediately with clear error
