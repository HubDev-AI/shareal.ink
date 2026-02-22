<!-- Generated: 2026-02-22 | Files scanned: 6 | Token estimate: ~400 -->
# Data

## Schema (prisma/schema.prisma)
```
┌──────────┐       ┌───────────┐       ┌──────────┐
│  OgJob   │──1:N──│   Space   │──1:N──│ Response │
└──────────┘       └───────────┘       └──────────┘
```

## Models

### OgJob
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | PK |
| url | String | Original URL |
| status | Enum | processing / completed / failed |
| title, description, imageUrl | String? | Scraped OG data |
| linkType | Enum | 11 types |
| extras | Json? | Site-specific: coords, videoId, embedUrl, tweetId, shortcode |
| error | String? | Error message on failure |
| Index | [status, createdAt] | |

### Space
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | PK |
| token | varchar(7) | Unique, URL slug |
| originalUrl | String? | Null for free-text spaces |
| title, description, imageUrl | String? | From OG or user input |
| linkType | Enum | 11 types |
| intentType | Enum | meet / vote / share (default: meet) |
| primaryActionLabel | String | CTA button text |
| intentText | String? | User's message/question |
| extras | Json? | Copied from OgJob |
| ogJobId | FK → OgJob | |
| Index | [ogJobId] | |

### Response
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | PK |
| spaceId | FK → Space | Cascade delete |
| responseType | Enum | yes / no |
| Index | [spaceId, responseType] | |

## Migrations (5 total)
1. Initial schema (Space, Response, OgJob)
2. Indexes on ogJobId
3. Extras JSON field on OgJob + Space
4. intentText on Space
5. Token length + new link types

## Config
- Prisma 7: datasource URL in `prisma.config.ts` (NOT schema.prisma)
- PrismaClient: Proxy-based lazy singleton in `lib/prisma.ts`
- Worker: uses own `pg.Pool` directly (not Prisma)
