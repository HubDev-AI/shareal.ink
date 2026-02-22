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

### Option A: Docker (recommended)

```bash
git clone https://github.com/HubDev-AI/shareal.ink.git
cd shareal.ink
docker compose up
```

This starts all 4 services (app, worker, postgres, redis). Open [localhost:3000](http://localhost:3000).

To also start a local Plausible analytics dashboard:

```bash
docker compose --profile analytics up
```

Then visit [localhost:8000](http://localhost:8000) to set up Plausible and add `localhost:3000` as a site. See [docs/DEPLOY.md](docs/DEPLOY.md) for details.

### Option B: Local (requires Bun, PostgreSQL, Redis)

```bash
git clone https://github.com/HubDev-AI/shareal.ink.git
cd shareal.ink
bun install

cp .env.example .env
bunx prisma generate
bunx prisma migrate dev

# Terminal 1: Next.js app
bun run dev

# Terminal 2: BullMQ worker (processes OG fetch jobs)
bun run worker
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
| `PLAUSIBLE_API_URL` | Self-hosted Plausible API URL | No |
| `UPSTASH_REDIS_REST_URL` | Production rate limiting | No |
| `UPSTASH_REDIS_REST_TOKEN` | Production rate limiting | No |
| `RATE_LIMIT_MAX` | Requests per window | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | No |

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for the full deployment guide.

| Service | Component | Provider |
|---------|-----------|----------|
| App | Next.js (serverless) | Vercel |
| Worker | BullMQ worker (`worker/index.ts`) | Railway |
| Database | PostgreSQL | Railway |
| Queue + Rate Limiting | Redis | Upstash |

The app and worker are separate processes. The app enqueues OG fetch jobs to Redis; the worker processes them. On Vercel the app runs as serverless functions — the worker **must** run as a persistent process on Railway.

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
