# Deployment Guide

Three services: **Vercel** (app), **Railway** (PostgreSQL), **Upstash** (Redis).

---

## 1. PostgreSQL — Railway

1. Create a new project at [railway.app](https://railway.app)
2. Add a **PostgreSQL** service
3. Copy the connection string from **Settings → Connect → DATABASE_URL**
4. Run migrations against the production database:
   ```bash
   DATABASE_URL="postgresql://..." bunx prisma migrate deploy
   ```

---

## 2. Redis — Upstash

1. Create a database at [console.upstash.com](https://console.upstash.com)
2. Copy these values from the database details page:

| Value | Used by |
|-------|---------|
| `UPSTASH_REDIS_REST_URL` | Rate limiting (REST protocol) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (REST protocol) |
| Redis URL (`rediss://...`) | BullMQ queue (`REDIS_URL`) |

> Upstash provides both REST and standard Redis protocols on the same database. BullMQ needs the standard `rediss://` URL. Rate limiting uses the REST API.

---

## 3. App — Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Next.js**
3. Build command: `bun run build` (Vercel auto-detects)
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `REDIS_URL` | Upstash Redis URL (`rediss://default:...@...upstash.io:6379`) |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `NEXT_PUBLIC_APP_URL` | `https://shareal.ink` |
| `PLAUSIBLE_DOMAIN` | `shareal.ink` (optional — omit to disable analytics) |

5. Deploy

---

## 4. Worker — Railway

The BullMQ worker (`worker/index.ts`) needs a persistent process (can't run on serverless). It runs as a separate Railway service from the same repo.

1. In the same Railway project, add a **new service** → Deploy from GitHub repo
2. Railway auto-detects `railway.toml` which configures:
   - **Dockerfile builder** targeting the `worker` stage (last stage in multi-stage Dockerfile)
   - **Health check** at `/health` (HTTP, 30s timeout)
   - **Restart policy** on failure (max 5 retries)
3. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Railway PostgreSQL connection string (same as Vercel) |
| `REDIS_URL` | Upstash Redis URL (`rediss://default:...@...upstash.io:6379`) |
| `PORT` | `8080` (health check server port) |
| `LOG_LEVEL` | `info` (optional — `debug`, `info`, `warn`, `error`) |

4. Deploy — the worker starts consuming jobs from the `og-fetch` queue

**What the worker does:**
- Consumes OG fetch jobs from BullMQ (Upstash Redis)
- Extracts metadata using `MetascraperOgFetcher` (same adapter as the app, with site-specific extractors for Maps, YouTube, Spotify, etc.)
- Updates `OgJob` and `Space` records in PostgreSQL
- Exposes `/health` endpoint with Redis + DB status
- Logs structured JSON (Railway auto-indexes these)
- Graceful shutdown: drains in-flight jobs on SIGTERM (30s timeout)

> **Security:** No direct communication between app and worker. They're decoupled via the Upstash Redis queue. Both connect to Redis over TLS (`rediss://`) and PostgreSQL over SSL.

---

## 5. Domain — Vercel

1. In Vercel project settings → **Domains** → add `shareal.ink`
2. Update DNS records at your registrar:
   - `A` record → Vercel IP (shown in dashboard)
   - `CNAME` for `www` → `cname.vercel-dns.com`
3. Vercel provisions SSL automatically

---

## 6. Analytics — Plausible (optional)

### Production (Plausible Cloud)

1. Add `shareal.ink` at [plausible.io](https://plausible.io)
2. Set `PLAUSIBLE_DOMAIN=shareal.ink` in Vercel env vars
3. The app auto-switches from NoopAnalytics to PlausibleAnalytics when this var is set

### Local Development (Self-Hosted)

A self-hosted Plausible CE instance is included in Docker Compose behind the `analytics` profile:

```bash
docker compose --profile analytics up
```

This starts Plausible CE (v3.2.0) + ClickHouse + a dedicated Postgres on port **8000**.

**First-time setup:**
1. Open [localhost:8000](http://localhost:8000) and create an account
2. Add `localhost:3000` as a site
3. Add these to your `.env`:
   ```
   PLAUSIBLE_DOMAIN=localhost:3000
   PLAUSIBLE_API_URL=http://localhost:8000/api/event
   ```

Events from the app are now tracked in your local Plausible dashboard. No cloud account needed.

---

## Environment Variables — Complete Reference

| Variable | Required | Where | Purpose |
|----------|----------|-------|---------|
| `DATABASE_URL` | Yes | Vercel + Railway worker | PostgreSQL connection |
| `REDIS_URL` | Yes | Vercel + Railway worker | BullMQ queue |
| `UPSTASH_REDIS_REST_URL` | Yes (prod) | Vercel | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (prod) | Vercel | Rate limiting |
| `NEXT_PUBLIC_APP_URL` | Yes | Vercel | OG meta, share URLs |
| `PLAUSIBLE_DOMAIN` | No | Vercel | Analytics |
| `PLAUSIBLE_API_URL` | No | Vercel | Self-hosted Plausible API (default: plausible.io) |
| `RATE_LIMIT_MAX` | No | Vercel | Requests per window (default: 20) |
| `RATE_LIMIT_WINDOW_MS` | No | Vercel | Window duration in ms (default: 60000) |
| `PORT` | No | Railway worker | Health check server port (default: 8080) |
| `LOG_LEVEL` | No | Railway worker | Logging level (default: info) |

---

## Post-Deploy Checklist

- [ ] Worker health check: `curl https://<worker-url>/health` returns `{"status":"ok"}`
- [ ] Paste a URL on the homepage — preview card loads
- [ ] Create a surface — redirects to `/[token]` with OG metadata
- [ ] Google Maps link — surface shows embedded map with place name
- [ ] YouTube link — surface shows video thumbnail/embed
- [ ] Share the surface URL — OG image/title shows in Slack/iMessage/etc
- [ ] QR code downloads with Nyra icon in center
- [ ] Rate limiting works (hit the endpoint 20+ times rapidly)
- [ ] Worker logs visible in Railway dashboard (structured JSON)
