# Config, Analytics & README Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `.env.example` with all production vars, rewrite README as a professional product page, and update CLAUDE.md to reflect the complete environment config.

**Architecture:** No code changes. Three files modified: `.env.example` (restructured), `README.md` (rewritten), `CLAUDE.md` (env section + analytics adapter table updated).

**Tech Stack:** Markdown, env files

---

### Task 1: Rewrite `.env.example`

**Files:**
- Modify: `.env.example`

**Step 1: Replace `.env.example` contents**

Write the following to `.env.example`:

```env
# ── Database ──────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shareal_ink?schema=public"

# ── Redis ─────────────────────────────────────────────────
# BullMQ queue (standard Redis protocol)
REDIS_URL="redis://localhost:6379"

# Upstash rate limiting (REST protocol — same Redis in prod)
# Uncomment for production:
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# ── Analytics ─────────────────────────────────────────────
# Plausible domain — omit to disable analytics (NoopAnalytics)
# PLAUSIBLE_DOMAIN=shareal.ink

# ── App ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: restructure .env.example with all production vars"
```

---

### Task 2: Rewrite README.md

**Files:**
- Modify: `README.md`

**Step 1: Replace README.md contents**

Write the following to `README.md`:

```markdown
# shareal.ink

> One link = One beautiful surface.

Share a link. Get a beautiful, responsive page with one-tap responses. No sign-up. No app. Just paste and share.

## Features

- **11 link types** — YouTube, Instagram, TikTok, Spotify, Google Maps, X/Twitter, Events, PDFs, Google Docs, Images, and generic URLs
- **Smart OG scraping** — Automatically extracts titles, descriptions, and thumbnails via async background jobs
- **3 intent types** — Meet, Vote, or Share — each with tailored UI and response options
- **QR codes** — Every surface gets an instant QR code for easy sharing
- **Beautiful surfaces** — Glass-morphism cards, aurora gradients, adaptive backgrounds per intent type
- **Zero friction** — No accounts, no sign-up. Paste a link, get a sharable surface in seconds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| Database | PostgreSQL via Prisma 7 |
| Queue | BullMQ + Redis |
| OG Scraping | metascraper |
| Styling | Tailwind CSS 4 |
| Animations | Motion 12 |
| Testing | Vitest + Playwright |

## Quick Start

**Prerequisites:** [Bun](https://bun.sh), PostgreSQL, Redis

```bash
# Clone and install
git clone https://github.com/HubDev-AI/shareal.ink.git
cd shareal.ink
bun install

# Set up database
cp .env.example .env
bunx prisma generate
bunx prisma migrate dev

# Start
bun run dev
```

Open [localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env`. Local defaults work out of the box.

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `REDIS_URL` | BullMQ job queue | Yes |
| `NEXT_PUBLIC_APP_URL` | App base URL | Yes |
| `PLAUSIBLE_DOMAIN` | Analytics (Plausible) | No |
| `UPSTASH_REDIS_REST_URL` | Production rate limiting | No |
| `UPSTASH_REDIS_REST_TOKEN` | Production rate limiting | No |
| `RATE_LIMIT_MAX` | Requests per window | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | No |

## Deployment

| Service | Component | Provider |
|---------|-----------|----------|
| App | Next.js (serverless) | Vercel |
| Database | PostgreSQL | Railway |
| Queue + Rate Limiting | Redis | Upstash |
| Worker | BullMQ worker process | Railway |

The BullMQ worker (`lib/worker.ts`) requires a persistent process. Run it as a separate Railway service in the same project as your database.

## Architecture

Every external dependency uses an adapter pattern — interface in `lib/interfaces/`, implementation in `lib/adapters/`, wired in `lib/container.ts`. Swap any dependency by changing one line.

```
lib/
  interfaces/     # Contracts (IOgFetcher, IQueue, IAnalytics, ...)
  adapters/       # Implementations (MetascraperOgFetcher, BullMQAdapter, ...)
  container.ts    # Dependency wiring (change one line to swap)
```

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README as professional product page"
```

---

### Task 3: Update CLAUDE.md environment section and adapter table

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the Environment section**

Replace the `## Environment` section (lines 70-77) with:

```markdown
## Environment
```env
# Required
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shareal_ink?schema=public"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional (production)
PLAUSIBLE_DOMAIN=shareal.ink          # Activates PlausibleAnalytics adapter
UPSTASH_REDIS_REST_URL=               # Activates UpstashRateLimiter adapter
UPSTASH_REDIS_REST_TOKEN=             # Required with UPSTASH_REDIS_REST_URL
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

**Step 2: Update the adapter table**

In the `### Adapter Pattern` section, update these two rows to reflect auto-switching:

| IAnalytics | NoopAnalytics / PlausibleAnalytics | Analytics (auto: PLAUSIBLE_DOMAIN) |
| IRateLimiter | InMemoryRateLimiter / UpstashRateLimiter | Rate limiting (auto: UPSTASH_REDIS_REST_URL) |

**Step 3: Update the "What's Next" section**

Remove the "Analytics (swap NoopAnalytics)" bullet since it's already active. The line to remove:
```
- Analytics (swap NoopAnalytics)
```

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with complete env config and adapter switching"
```

---

### Task 4: Verify and final commit

**Step 1: Verify build still passes**

```bash
bun run build
```

Expected: Build succeeds (no code changes, only docs/config).

**Step 2: Verify tests still pass**

```bash
bun run test
```

Expected: All 25 tests pass.

**Step 3: Verify .env.example is valid**

```bash
cp .env.example .env.test-verify
```

Confirm it's parseable and has no syntax errors.
