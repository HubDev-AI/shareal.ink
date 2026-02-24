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
make up
```

This starts all 4 services (app, worker, postgres, redis) and rebuilds images automatically. Open [localhost:3000](http://localhost:3000).

After pulling new code, just run `make up` again — it rebuilds changed images before starting.

To also start a local Plausible analytics dashboard:

```bash
make up-analytics
```

Then visit [localhost:8000](http://localhost:8000) to set up Plausible and add `localhost:3000` as a site. See [docs/DEPLOY.md](docs/DEPLOY.md) for details.

### Option B: Local (requires Bun, PostgreSQL, Redis)

```bash
git clone https://github.com/HubDev-AI/shareal.ink.git
cd shareal.ink
make install

cp .env.example .env
make generate
bunx prisma migrate dev

# Terminal 1: Next.js app
make dev

# Terminal 2: BullMQ worker (processes OG fetch jobs)
make worker-dev
```

Open [localhost:3000](http://localhost:3000).

## Make Targets

Run `make help` to see all available targets:

| Target | Description |
|--------|-------------|
| `make up` | Start all services (rebuilds if code changed) |
| `make up-d` | Start all services in background |
| `make down` | Stop all services |
| `make rebuild` | Full rebuild from scratch (no cache) |
| `make logs` | Tail logs from all services |
| `make logs-app` | Tail app logs only |
| `make logs-worker` | Tail worker logs only |
| `make clean` | Stop services and remove volumes (resets DB) |
| `make dev` | Start Next.js dev server (local) |
| `make worker-dev` | Start BullMQ worker (local) |
| `make test` | Run unit tests |
| `make test-e2e` | Run E2E tests |
| `make generate` | Regenerate Prisma client |
| `make migrate name=xyz` | Create + apply a new migration |

## Environment

Copy `.env.example` to `.env`. Local defaults work out of the box.

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `REDIS_URL` | BullMQ job queue | Yes |
| `NEXT_PUBLIC_APP_URL` | App base URL | Yes |
| `PLAUSIBLE_DOMAIN` | Analytics (Plausible) | No |
| `PLAUSIBLE_API_URL` | Self-hosted Plausible API URL | No |
| `RATE_LIMIT_MAX` | Requests per window | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | No |
| `SENTRY_DSN` | Error tracking (Sentry) | No |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side error tracking | No |

## CI/CD

PRs to `dev` and `main` run automated checks via GitHub Actions:

- **lint-and-typecheck** — `bun run build` (TypeScript via Turbopack)
- **unit-tests** — `bun run test` (100 Vitest tests)
- **e2e-tests** — Playwright against Postgres + Redis service containers

Merges to `main` trigger [release-please](https://github.com/googleapis/release-please) which auto-creates Release PRs with CHANGELOG and semver bumps.

[Dependabot](.github/dependabot.yml) opens weekly PRs for dependency updates.

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
