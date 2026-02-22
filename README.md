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
