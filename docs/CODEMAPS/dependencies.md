<!-- Generated: 2026-02-22 | Files scanned: 8 | Token estimate: ~400 -->
# Dependencies

## External Services
| Service | Adapter | Purpose | Config |
|---------|---------|---------|--------|
| PostgreSQL | Prisma 7.4.1 + pg Pool | Primary data store | DATABASE_URL |
| Redis | BullMQ 5.70.0 | Job queue | REDIS_URL |
| Upstash Redis | @upstash/ratelimit | Rate limiting (prod) | UPSTASH_REDIS_REST_URL + TOKEN |
| Plausible | PlausibleAnalytics adapter | Privacy-first analytics (prod) | PLAUSIBLE_DOMAIN |
| Sentry | @sentry/nextjs | Error tracking | SENTRY_DSN |

## Key Dependencies
| Package | Version | Usage |
|---------|---------|-------|
| next | 16.1.6 | App Router, SSR, API routes |
| react | 19.2.3 | UI framework |
| prisma | 7.4.1 | ORM + migrations |
| bullmq | 5.70.0 | Job queue (OG fetch) |
| metascraper | 5.49.24 | OG metadata extraction |
| motion | 12.34.3 | Animations (import from motion/react) |
| tailwindcss | 4.x | Styling |
| nanoid | 5.x | Token generation (7-char base62) |
| qrcode | 1.x | QR code generation |
| react-markdown | 9.x | Intent text rendering |

## Site-Specific Extractors
```
lib/adapters/site-extractors/
├── google-maps.ts  — coords, place name, resolved URL
├── youtube.ts      — videoId, maxresdefault thumbnail
├── spotify.ts      — embedUrl, contentType, contentId
├── instagram.ts    — shortcode, resolvedUrl
├── tiktok.ts       — videoId, resolvedUrl
└── x-twitter.ts    — tweetId, resolvedUrl
```

## Infrastructure
| Target | Platform | Notes |
|--------|----------|-------|
| Next.js app | Vercel | SSR + API routes |
| BullMQ worker | Railway (Docker) | Standalone bun process |
| PostgreSQL | Railway | Shared instance possible |
| Redis | Upstash | Serverless Redis |

## Docker
- `Dockerfile`: Multi-stage (base → app target on :3000, worker target on :8080)
- `docker-compose.yml`: postgres:16, redis:7, migrate, app, worker + optional Plausible analytics profile
