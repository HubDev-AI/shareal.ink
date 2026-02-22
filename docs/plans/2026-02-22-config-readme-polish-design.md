# Config, Analytics & README Polish — Design

> Date: 2026-02-22

## Goals

1. Document how analytics connects (Plausible — already implemented, just needs env var)
2. Clarify full Redis/queue production architecture (Upstash + Railway worker)
3. Replace boilerplate README with a professional product-focused page
4. Restructure `.env.example` with all production vars and clear documentation

## 1. Analytics (Plausible)

**Status: Already implemented. Zero code changes needed.**

The adapter pattern in `container.ts` auto-switches:

```typescript
export const analytics: IAnalytics = process.env.PLAUSIBLE_DOMAIN
  ? new PlausibleAnalytics(process.env.PLAUSIBLE_DOMAIN)
  : new NoopAnalytics();
```

To activate:
- Add `PLAUSIBLE_DOMAIN=shareal.ink` to production env
- 4 events already fire: `og_skipped`, `og_job_created`, `space_created`, `space_responded`
- Plausible Cloud ($9/mo) or self-hosted

## 2. Queue / Redis Production Architecture

### One Upstash Redis Database, Two Protocols

| Component | Env Var | Protocol | Purpose |
|-----------|---------|----------|---------|
| BullMQ (queue + worker) | `REDIS_URL` | Standard Redis (`rediss://`) | Job queue for async OG fetching |
| Rate limiting | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | REST API | Sliding window rate limits |

Both use the same Upstash database. No code changes — just env config.

### Worker Hosting

BullMQ worker (`lib/worker.ts`) needs a persistent process. Vercel serverless won't keep it alive.

**Solution: Railway service**
- Run the worker as a separate Railway service
- Same Railway project as Postgres
- Command: `node --import tsx lib/worker.ts` (or a dedicated `worker.ts` entrypoint)
- ~$5/mo on Railway

### Production Topology

```
User → Vercel (Next.js app)
         ├── API routes enqueue jobs → Upstash Redis (standard protocol)
         └── Rate limiting → Upstash Redis (REST protocol)

Railway Worker Service
         └── BullMQ worker polls → Upstash Redis → writes to Railway Postgres
```

## 3. Comprehensive `.env.example`

Restructured with sections, comments, and all production vars:

```env
# ── Database ──────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shareal_ink?schema=public"

# ── Redis ─────────────────────────────────────────────────
# BullMQ queue (standard Redis protocol)
REDIS_URL="redis://localhost:6379"

# Upstash rate limiting (REST protocol, same Redis instance in prod)
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# ── Analytics ─────────────────────────────────────────────
# Plausible domain (omit to use NoopAnalytics)
# PLAUSIBLE_DOMAIN=shareal.ink

# ── App ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

Local defaults work out of the box. Production vars are commented with explanation.

## 4. Product-focused README

### Structure

1. **Hero** — Name + tagline + one-liner description
2. **What it does** — 2-3 sentences about the product
3. **Features** — Bullet list: 11 link types, 3 intents, OG scraping, QR codes, responsive surfaces
4. **Tech stack** — Clean list (Next.js, TypeScript, Prisma, BullMQ, Tailwind, Motion)
5. **Quick start** — Prerequisites + 5 commands
6. **Environment** — Reference to `.env.example`
7. **Deployment** — Vercel + Railway + Upstash overview
8. **Architecture** — Brief adapter pattern explanation
9. **License** — TBD

### Tone

Professional, concise, product-first. No "bootstrapped with create-next-app." Focus on what shareal.ink does and how to get running.

## Files Changed

| File | Change |
|------|--------|
| `.env.example` | Restructure with sections, add Plausible + Upstash vars |
| `README.md` | Complete rewrite — product-focused |
| `CLAUDE.md` | Update env section to match new `.env.example` |

## No Code Changes

All adapters, interfaces, and container wiring are already correct. This is purely a documentation and configuration task.
