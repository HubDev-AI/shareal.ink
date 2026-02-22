# Deployment Guide

Four services: **Railway** (app + worker), **Railway** (PostgreSQL), **Upstash** (Redis), **Cloudflare** (DNS).

---

## 1. PostgreSQL — Railway

1. Create a `shared-infra` project at [railway.app](https://railway.app)
2. Add a **PostgreSQL** service
3. Create a dedicated database for the app:
   ```bash
   railway link  # link to shared-infra project
   railway connect postgres
   # In psql:
   CREATE DATABASE shareal_ink;
   ```
4. Copy the connection string from **Settings → Connect → DATABASE_URL**, replacing the database name with `shareal_ink`
5. Run migrations against the production database:
   ```bash
   DATABASE_URL="postgresql://..." bunx prisma migrate deploy
   ```

> **Shared infrastructure:** The `shared-infra` project can host databases for multiple apps. Create a separate database per app (e.g., `shareal_ink`, `milkly`) using the same PostgreSQL instance.

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

## 3. App — Railway

The Next.js app runs as a Railway service using `Dockerfile.app`.

1. Create a `shareal-ink` project at [railway.app](https://railway.app)
2. Add a **new service** → Deploy from GitHub repo (`HubDev-AI/shareal.ink`)
3. Set the deploy branch to `main`
4. Railway auto-detects `railway.toml` (root) which configures:
   - **Dockerfile builder** using `Dockerfile.app`
   - **Health check** at `/api/health` (HTTP, 60s timeout)
   - **Start command** `bun run start`
   - **Restart policy** on failure (max 5 retries)
5. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Railway PostgreSQL connection string (shared-infra, `shareal_ink` database) |
| `REDIS_URL` | Upstash Redis URL (`rediss://default:...@...upstash.io:6379`) |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `NEXT_PUBLIC_APP_URL` | `https://shareal.ink` |
| `RATE_LIMIT_MAX` | `20` |
| `RATE_LIMIT_WINDOW_MS` | `60000` |
| `PORT` | `3000` |
| `PLAUSIBLE_DOMAIN` | `shareal.ink` (optional — omit to disable analytics) |
| `SENTRY_DSN` | Sentry DSN (optional — omit to disable error tracking) |
| `NEXT_PUBLIC_SENTRY_DSN` | Same DSN for client-side (optional) |

6. Deploy — generate a Railway domain to verify it works before adding the custom domain

---

## 4. Worker — Railway

The BullMQ worker (`worker/index.ts`) needs a persistent process. It runs as a separate Railway service in the same project, using `Dockerfile.worker`.

1. In the `shareal-ink` project, add a **new service** → Deploy from GitHub repo (same repo)
2. Set the deploy branch to `main`
3. Set the **Config as Code** path to `worker/railway.toml` in service settings (this tells Railway to use `Dockerfile.worker` with healthcheck at `/health`)
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Railway PostgreSQL connection string (same as app) |
| `REDIS_URL` | Upstash Redis URL (`rediss://default:...@...upstash.io:6379`) |
| `PORT` | `8080` (health check server port) |
| `LOG_LEVEL` | `info` (optional — `debug`, `info`, `warn`, `error`) |

5. Deploy — the worker starts consuming jobs from the `og-fetch` queue

**What the worker does:**
- Consumes OG fetch jobs from BullMQ (Upstash Redis)
- Extracts metadata using `MetascraperOgFetcher` (same adapter as the app, with site-specific extractors for Maps, YouTube, Spotify, etc.)
- Updates `OgJob` and `Space` records in PostgreSQL
- Exposes `/health` endpoint with Redis + DB status
- Logs structured JSON (Railway auto-indexes these)
- Graceful shutdown: drains in-flight jobs on SIGTERM (30s timeout)

> **Security:** No direct communication between app and worker. They're decoupled via the Upstash Redis queue. Both connect to Redis over TLS (`rediss://`) and PostgreSQL over SSL.

### Per-Service Config Files

The repo contains separate config files for each Railway service:

| File | Service | Dockerfile | Healthcheck |
|------|---------|------------|-------------|
| `railway.toml` (root) | App | `Dockerfile.app` | `/api/health` (60s) |
| `worker/railway.toml` | Worker | `Dockerfile.worker` | `/health` (30s) |

The original multi-stage `Dockerfile` is used by docker-compose for local development only.

---

## 5. Domain — Cloudflare + Namecheap

1. Add `shareal.ink` at [dash.cloudflare.com](https://dash.cloudflare.com) (Free plan)
2. Add the custom domain in Railway: `railway domain shareal.ink --service <app-service>`
3. Railway provides a CNAME target (e.g., `xyz.up.railway.app`) and a `_railway-verify` TXT record
4. In Cloudflare DNS, add:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| `CNAME` | `@` | `<railway-cname>.up.railway.app` | **DNS only** (initially) |
| `CNAME` | `www` | `<railway-cname>.up.railway.app` | **DNS only** (initially) |
| `TXT` | `_railway-verify` | (value from Railway) | DNS only |

5. At Namecheap → Domain List → `shareal.ink` → Manage → Nameservers → **Custom DNS** → enter the two Cloudflare nameservers
6. Wait for Railway to provision the SSL certificate (1-5 minutes) — verify with `curl https://shareal.ink`
7. Once the site is live, switch both CNAME records to **Proxied** (orange cloud) in Cloudflare
8. Set Cloudflare SSL/TLS → **Full (strict)**

> **Important:** Keep DNS records as "DNS only" until Railway provisions the Let's Encrypt cert. Cloudflare's CNAME flattening on root domains can block cert verification. Switch to Proxied after the cert is active.

---

## 6. Analytics — Plausible (optional)

### Production (Plausible Cloud)

1. Add `shareal.ink` at [plausible.io](https://plausible.io)
2. Set `PLAUSIBLE_DOMAIN=shareal.ink` in Railway app env vars
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
| `DATABASE_URL` | Yes | Railway app + worker | PostgreSQL connection |
| `REDIS_URL` | Yes | Railway app + worker | BullMQ queue |
| `UPSTASH_REDIS_REST_URL` | Yes (prod) | Railway app | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (prod) | Railway app | Rate limiting |
| `NEXT_PUBLIC_APP_URL` | Yes | Railway app | OG meta, share URLs |
| `PLAUSIBLE_DOMAIN` | No | Railway app | Analytics |
| `PLAUSIBLE_API_URL` | No | Railway app | Self-hosted Plausible API (default: plausible.io) |
| `RATE_LIMIT_MAX` | No | Railway app | Requests per window (default: 20) |
| `RATE_LIMIT_WINDOW_MS` | No | Railway app | Window duration in ms (default: 60000) |
| `PORT` | No | Railway app + worker | Server port (app: 3000, worker: 8080) |
| `LOG_LEVEL` | No | Railway worker | Logging level (default: info) |
| `SENTRY_DSN` | No | Railway app + worker | Server-side error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Railway app | Client-side error tracking |
| `SENTRY_AUTH_TOKEN` | No | CI only | Source map uploads to Sentry |
| `SENTRY_ORG` | No | CI only | Sentry organization slug |
| `SENTRY_PROJECT` | No | CI only | Sentry project slug |

---

## Post-Deploy Checklist

- [ ] App health check: `curl https://shareal.ink/api/health` returns `{"status":"ok"}`
- [ ] Worker health check: visible as "Online" in Railway dashboard
- [ ] Paste a URL on the homepage — preview card loads
- [ ] Create a surface — redirects to `/[token]` with OG metadata
- [ ] Google Maps link — surface shows embedded map with place name
- [ ] YouTube link — surface shows video thumbnail/embed
- [ ] Share the surface URL — OG image/title shows in Slack/iMessage/etc
- [ ] QR code downloads with Nyra icon in center
- [ ] Rate limiting works (hit the endpoint 20+ times rapidly)
- [ ] Worker logs visible in Railway dashboard (structured JSON)
- [ ] Cloudflare proxying active (check `cf-ray` header in response)
