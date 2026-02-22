# Railway Worker Service — Design

**Date**: 2026-02-22
**Status**: Approved

## Problem

The BullMQ worker (`worker/index.ts`) needs to run as a production service on Railway with health checks, structured logging, graceful shutdown, and a path to scaling.

## Architecture

```
Vercel (app) → Upstash Redis (queue) ← Railway (worker)
                                        Railway (PostgreSQL)
```

No direct app↔worker communication. Decoupled via queue.

## Solution

Three additions to the current worker:

### 1. HTTP Health Check Server

Minimal `Bun.serve` on configurable port:
- `GET /health` → 200 with status, queue connection, DB connection, uptime
- Railway TCP health check pointed at this port

### 2. Structured JSON Logging

Replace console.log/error with JSON lines:
- `{ level, message, jobId, duration, timestamp }` per job
- Periodic stats: jobs processed, avg duration, failure rate
- Railway auto-indexes JSON logs

### 3. Enhanced Graceful Shutdown

- SIGTERM → stop accepting jobs, drain in-flight (30s timeout)
- Close health server, DB pool, exit
- `RAILWAY_GRACEFUL_SHUTDOWN_TIMEOUT=30`

## Railway Config

- Deploy from same repo, Dockerfile target `worker`
- Health check: TCP on health port
- Restart: always
- Scaling: 1 replica to start, BullMQ supports competing consumers

## Security

- Upstash Redis: TLS (`rediss://`) + token auth
- Railway PostgreSQL: SSL by default
- No shared secrets between app and worker

## Files Changed

| File | Change |
|------|--------|
| `worker/index.ts` | Integrate health server, logger, enhanced shutdown |
| `worker/health.ts` | New — HTTP health check server |
| `worker/logger.ts` | New — Structured JSON logger |
| `Dockerfile` | Expose health port on worker target |
| `docker-compose.yml` | Add health check for worker service |
