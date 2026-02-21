# shareal.ink MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the shareal.ink MVP — turn any shared link into a beautiful, structured planning surface with RSVP.

**Architecture:** Next.js 16 App Router with adapter pattern for all external dependencies. Async OG fetching via BullMQ + Upstash Redis. Prisma 7 + PostgreSQL. Hand-built Tailwind UI.

**Tech Stack:** Next.js 16.1.6, Prisma 7.4.1, BullMQ 5.70.0, Upstash Redis, metascraper 5.49.24, nanoid 5.1.6, Motion 12.34.3, Tailwind CSS 4.2.0, bun

**Exact package versions (verified 2026-02-21):**
| Package | Version |
|---------|---------|
| next | 16.1.6 |
| prisma | 7.4.1 |
| @prisma/client | 7.4.1 |
| bullmq | 5.70.0 |
| metascraper | 5.49.24 |
| metascraper-title | 5.49.24 |
| metascraper-description | 5.49.24 |
| metascraper-image | 5.49.24 |
| nanoid | 5.1.6 |
| motion | 12.34.3 |
| ioredis | 5.9.3 |
| clsx | 2.1.1 |
| tailwind-merge | 3.5.0 |
| lucide-react | 0.575.0 |
| tailwindcss | 4.2.0 |

**Prisma 7 notes:** Requires `prisma.config.ts` for CLI commands. Don't use `@map` on enum values (known bug). Requires Node.js 20.19+.

**Worktree root:** `/Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth`
**Project root:** `{worktree}/shareal-ink/` (created in Task 1)

---

## Task 1: Scaffold Next.js Project & Install Dependencies

**Files:**
- Create: `shareal-ink/` (entire project scaffold)
- Create: `shareal-ink/.env.example`
- Modify: `shareal-ink/next.config.ts`

**Step 1: Create Next.js project**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
bun create next-app shareal-ink --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*" --turbopack
```

Expected: Project scaffold created with `app/`, `public/`, `package.json`, etc.

**Step 2: Install dependencies**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun add @prisma/client@7.4.1 nanoid@5.1.6 motion@12.34.3 clsx@2.1.1 tailwind-merge@3.5.0 lucide-react@0.575.0 bullmq@5.70.0 ioredis@5.9.3 metascraper@5.49.24 metascraper-title@5.49.24 metascraper-description@5.49.24 metascraper-image@5.49.24
bun add -d prisma@7.4.1 vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: Create `.env.example`**

Create `shareal-ink/.env.example`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shareal_ink?schema=public"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

**Step 4: Configure `next.config.ts`**

Replace `shareal-ink/next.config.ts` with:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: ["bullmq", "ioredis", "metascraper"],
};

export default nextConfig;
```

Note: `serverExternalPackages` prevents Next.js from bundling these Node.js-only packages.

**Step 5: Create vitest config**

Create `shareal-ink/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Add to `shareal-ink/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 6: Verify scaffold works**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

## Task 2: Design System & Global Styles

**Files:**
- Modify: `shareal-ink/app/globals.css`
- Create: `shareal-ink/lib/utils.ts`
- Modify: `shareal-ink/app/layout.tsx`

**Step 1: Configure Tailwind globals**

Replace `shareal-ink/app/globals.css` with:
```css
@import "tailwindcss";

@theme {
  --color-background: #FAFAF8;
  --color-foreground: #1a1a1a;
  --color-muted: #6b7280;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-border: #e5e5e3;
  --color-surface: #ffffff;
  --color-success: #16a34a;

  --radius-md: 12px;
  --radius-lg: 16px;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Step 2: Create `cn()` utility**

Create `shareal-ink/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 3: Update root layout with Inter font**

Replace `shareal-ink/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "shareal.ink",
  description: "Share a link. Make it make sense.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Step 4: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

**Step 5: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/app/globals.css shareal-ink/lib/utils.ts shareal-ink/app/layout.tsx
git commit -m "feat: add design system, global styles, Inter font"
```

---

## Task 3: Prisma Schema & Database Setup

**Files:**
- Create: `shareal-ink/prisma/schema.prisma`
- Create: `shareal-ink/lib/prisma.ts`

**Step 1: Create Prisma schema**

Create `shareal-ink/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum LinkType {
  restaurant
  video
  event
  generic
}

enum IntentType {
  meet
  vote
  share
}

enum OgJobStatus {
  processing
  completed
  failed
}

enum ResponseType {
  yes
  no
}

model Space {
  id                 String      @id @default(cuid())
  token              String      @unique @db.VarChar(22)
  originalUrl        String?     @map("original_url")
  title              String?
  description        String?
  imageUrl           String?     @map("image_url")
  linkType           LinkType    @map("link_type")
  intentType         IntentType  @default(meet) @map("intent_type")
  primaryActionLabel String      @map("primary_action_label")
  ogJobId            String?     @map("og_job_id")
  creatorUserId      String?     @map("creator_user_id")
  expiresAt          DateTime?   @map("expires_at")
  createdAt          DateTime    @default(now()) @map("created_at")

  ogJob     OgJob?     @relation(fields: [ogJobId], references: [id])
  responses Response[]

  @@map("spaces")
}

model Response {
  id           String       @id @default(cuid())
  spaceId      String       @map("space_id")
  responseType ResponseType @map("response_type")
  createdAt    DateTime     @default(now()) @map("created_at")

  space Space @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  @@index([spaceId])
  @@map("responses")
}

model OgJob {
  id          String      @id @default(cuid())
  url         String
  status      OgJobStatus @default(processing)
  title       String?
  description String?
  imageUrl    String?     @map("image_url")
  linkType    LinkType    @map("link_type")
  error       String?
  createdAt   DateTime    @default(now()) @map("created_at")
  completedAt DateTime?   @map("completed_at")

  spaces Space[]

  @@map("og_jobs")
}
```

**Step 2: Create Prisma singleton**

Create `shareal-ink/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 3: Create `.env` from example and generate client**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
cp .env.example .env
bunx prisma generate
```

Expected: Prisma client generated successfully.

Note: Don't run migrations yet — we'll need a running Postgres first. The `prisma generate` is enough to unblock the build.

**Step 4: Add `.env` to `.gitignore`**

Verify `shareal-ink/.gitignore` includes `.env` (Next.js scaffold should already have this). If not, add it.

**Step 5: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

**Step 6: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/prisma/schema.prisma shareal-ink/lib/prisma.ts shareal-ink/.env.example
git commit -m "feat: add Prisma schema with Space, Response, OgJob models"
```

---

## Task 4: Interfaces & Types

**Files:**
- Create: `shareal-ink/lib/types.ts`
- Create: `shareal-ink/lib/interfaces/og-fetcher.ts`
- Create: `shareal-ink/lib/interfaces/queue.ts`
- Create: `shareal-ink/lib/interfaces/auth.ts`
- Create: `shareal-ink/lib/interfaces/analytics.ts`
- Create: `shareal-ink/lib/interfaces/rate-limiter.ts`
- Create: `shareal-ink/lib/interfaces/link-detector.ts`
- Create: `shareal-ink/lib/interfaces/image-store.ts`
- Create: `shareal-ink/lib/interfaces/index.ts`

**Step 1: Create shared types**

Create `shareal-ink/lib/types.ts`:
```typescript
export type LinkType = "restaurant" | "video" | "event" | "generic";
export type IntentType = "meet" | "vote" | "share";
export type OgJobStatus = "processing" | "completed" | "failed";
export type ResponseType = "yes" | "no";

export interface OgMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

export interface LinkDetectionResult {
  linkType: LinkType;
  suggestedActionLabel: string;
}

export interface SpaceCreateInput {
  url: string | null;
  title: string | null;
  description: string | null;
  linkType: LinkType;
  primaryActionLabel: string;
  ogJobId: string | null;
}

export interface SpaceData {
  token: string;
  originalUrl: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  linkType: LinkType;
  intentType: IntentType;
  primaryActionLabel: string;
  createdAt: Date;
  responseCount: number;
}

export interface OgJobData {
  id: string;
  url: string;
  status: OgJobStatus;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  linkType: LinkType;
  error: string | null;
}

export interface AuthUser {
  userId: string;
  isAuthenticated: boolean;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}
```

**Step 2: Create interfaces**

Create `shareal-ink/lib/interfaces/og-fetcher.ts`:
```typescript
import { OgMetadata } from "@/lib/types";

export interface IOgFetcher {
  fetch(url: string): Promise<OgMetadata>;
}
```

Create `shareal-ink/lib/interfaces/queue.ts`:
```typescript
export interface IQueue {
  enqueue(jobName: string, data: Record<string, unknown>): Promise<string>;
  close(): Promise<void>;
}
```

Create `shareal-ink/lib/interfaces/auth.ts`:
```typescript
import { AuthUser } from "@/lib/types";

export interface IAuthProvider {
  getCurrentUser(): Promise<AuthUser>;
}
```

Create `shareal-ink/lib/interfaces/analytics.ts`:
```typescript
import { AnalyticsEvent } from "@/lib/types";

export interface IAnalytics {
  track(event: AnalyticsEvent): void;
}
```

Create `shareal-ink/lib/interfaces/rate-limiter.ts`:
```typescript
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface IRateLimiter {
  check(key: string): Promise<RateLimitResult>;
}
```

Create `shareal-ink/lib/interfaces/link-detector.ts`:
```typescript
import { LinkDetectionResult } from "@/lib/types";

export interface ILinkDetector {
  detect(url: string): LinkDetectionResult;
}
```

Create `shareal-ink/lib/interfaces/image-store.ts`:
```typescript
export interface IImageStore {
  store(imageUrl: string): Promise<string>;
}
```

Create `shareal-ink/lib/interfaces/index.ts`:
```typescript
export type { IOgFetcher } from "./og-fetcher";
export type { IQueue } from "./queue";
export type { IAuthProvider } from "./auth";
export type { IAnalytics } from "./analytics";
export type { IRateLimiter, RateLimitResult } from "./rate-limiter";
export type { ILinkDetector } from "./link-detector";
export type { IImageStore } from "./image-store";
```

**Step 3: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

**Step 4: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/lib/types.ts shareal-ink/lib/interfaces/
git commit -m "feat: add shared types and adapter interfaces"
```

---

## Task 5: Adapters — Link Detector & Tokens (TDD)

**Files:**
- Create: `shareal-ink/lib/adapters/regex-link-detector.ts`
- Create: `shareal-ink/lib/__tests__/regex-link-detector.test.ts`
- Create: `shareal-ink/lib/tokens.ts`
- Create: `shareal-ink/lib/__tests__/tokens.test.ts`

**Step 1: Write failing test for link detector**

Create `shareal-ink/lib/__tests__/regex-link-detector.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { RegexLinkDetector } from "@/lib/adapters/regex-link-detector";

const detector = new RegexLinkDetector();

describe("RegexLinkDetector", () => {
  it("detects Google Maps as restaurant", () => {
    const result = detector.detect("https://maps.google.com/maps?q=Pizza+Place");
    expect(result.linkType).toBe("restaurant");
    expect(result.suggestedActionLabel).toBe("I'm in!");
  });

  it("detects goo.gl/maps as restaurant", () => {
    const result = detector.detect("https://goo.gl/maps/abc123");
    expect(result.linkType).toBe("restaurant");
  });

  it("detects Yelp as restaurant", () => {
    const result = detector.detect("https://www.yelp.com/biz/pizza-place");
    expect(result.linkType).toBe("restaurant");
  });

  it("detects YouTube as video", () => {
    const result = detector.detect("https://www.youtube.com/watch?v=abc123");
    expect(result.linkType).toBe("video");
    expect(result.suggestedActionLabel).toBe("I'll watch it");
  });

  it("detects youtu.be as video", () => {
    const result = detector.detect("https://youtu.be/abc123");
    expect(result.linkType).toBe("video");
  });

  it("detects Vimeo as video", () => {
    const result = detector.detect("https://vimeo.com/123456");
    expect(result.linkType).toBe("video");
  });

  it("detects TikTok as video", () => {
    const result = detector.detect("https://www.tiktok.com/@user/video/123");
    expect(result.linkType).toBe("video");
  });

  it("detects Eventbrite as event", () => {
    const result = detector.detect("https://www.eventbrite.com/e/my-event-123");
    expect(result.linkType).toBe("event");
    expect(result.suggestedActionLabel).toBe("I'm in!");
  });

  it("detects lu.ma as event", () => {
    const result = detector.detect("https://lu.ma/my-event");
    expect(result.linkType).toBe("event");
  });

  it("detects Meetup as event", () => {
    const result = detector.detect("https://www.meetup.com/group/events/123");
    expect(result.linkType).toBe("event");
  });

  it("returns generic for unknown URLs", () => {
    const result = detector.detect("https://example.com/some-page");
    expect(result.linkType).toBe("generic");
    expect(result.suggestedActionLabel).toBe("Interested");
  });

  it("returns generic for blog posts", () => {
    const result = detector.detect("https://medium.com/article-title");
    expect(result.linkType).toBe("generic");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test -- lib/__tests__/regex-link-detector.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement link detector**

Create `shareal-ink/lib/adapters/regex-link-detector.ts`:
```typescript
import type { ILinkDetector } from "@/lib/interfaces";
import type { LinkDetectionResult, LinkType } from "@/lib/types";

interface PatternRule {
  pattern: RegExp;
  linkType: LinkType;
  actionLabel: string;
}

const RULES: PatternRule[] = [
  // Restaurant / Places
  { pattern: /maps\.google\.|google\.\w+\/maps|goo\.gl\/maps/i, linkType: "restaurant", actionLabel: "I'm in!" },
  { pattern: /yelp\.com/i, linkType: "restaurant", actionLabel: "I'm in!" },
  { pattern: /opentable\.com/i, linkType: "restaurant", actionLabel: "I'm in!" },
  { pattern: /resy\.com/i, linkType: "restaurant", actionLabel: "I'm in!" },
  { pattern: /tripadvisor\.com/i, linkType: "restaurant", actionLabel: "I'm in!" },

  // Video
  { pattern: /youtube\.com|youtu\.be/i, linkType: "video", actionLabel: "I'll watch it" },
  { pattern: /vimeo\.com/i, linkType: "video", actionLabel: "I'll watch it" },
  { pattern: /tiktok\.com/i, linkType: "video", actionLabel: "I'll watch it" },

  // Events
  { pattern: /eventbrite\.com/i, linkType: "event", actionLabel: "I'm in!" },
  { pattern: /meetup\.com/i, linkType: "event", actionLabel: "I'm in!" },
  { pattern: /lu\.ma/i, linkType: "event", actionLabel: "I'm in!" },
];

export class RegexLinkDetector implements ILinkDetector {
  detect(url: string): LinkDetectionResult {
    for (const rule of RULES) {
      if (rule.pattern.test(url)) {
        return { linkType: rule.linkType, suggestedActionLabel: rule.actionLabel };
      }
    }
    return { linkType: "generic", suggestedActionLabel: "Interested" };
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test -- lib/__tests__/regex-link-detector.test.ts
```

Expected: All PASS.

**Step 5: Write failing test for token generator**

Create `shareal-ink/lib/__tests__/tokens.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { createSpaceToken } from "@/lib/tokens";

describe("createSpaceToken", () => {
  it("returns a 22-character string", () => {
    const token = createSpaceToken();
    expect(token).toHaveLength(22);
  });

  it("uses only base62 characters", () => {
    const token = createSpaceToken();
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => createSpaceToken()));
    expect(tokens.size).toBe(100);
  });
});
```

**Step 6: Run test to verify it fails**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test -- lib/__tests__/tokens.test.ts
```

Expected: FAIL.

**Step 7: Implement token generator**

Create `shareal-ink/lib/tokens.ts`:
```typescript
import { nanoid, customAlphabet } from "nanoid";

const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateToken = customAlphabet(BASE62, 22);

export function createSpaceToken(): string {
  return generateToken();
}
```

**Step 8: Run test to verify it passes**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test -- lib/__tests__/tokens.test.ts
```

Expected: All PASS.

**Step 9: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/lib/adapters/regex-link-detector.ts shareal-ink/lib/__tests__/regex-link-detector.test.ts shareal-ink/lib/tokens.ts shareal-ink/lib/__tests__/tokens.test.ts
git commit -m "feat: add link detector and token generator with tests"
```

---

## Task 6: Adapters — Rate Limiter, Noop Auth, Noop Analytics, Image Store (TDD)

**Files:**
- Create: `shareal-ink/lib/adapters/in-memory-rate-limiter.ts`
- Create: `shareal-ink/lib/__tests__/in-memory-rate-limiter.test.ts`
- Create: `shareal-ink/lib/adapters/noop-auth.ts`
- Create: `shareal-ink/lib/adapters/noop-analytics.ts`
- Create: `shareal-ink/lib/adapters/passthrough-image-store.ts`
- Create: `shareal-ink/lib/adapters/index.ts`

**Step 1: Write failing test for rate limiter**

Create `shareal-ink/lib/__tests__/in-memory-rate-limiter.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRateLimiter } from "@/lib/adapters/in-memory-rate-limiter";

describe("InMemoryRateLimiter", () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter({ maxRequests: 3, windowMs: 1000 });
  });

  it("allows requests under the limit", async () => {
    const result = await limiter.check("ip-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests over the limit", async () => {
    await limiter.check("ip-1");
    await limiter.check("ip-1");
    await limiter.check("ip-1");
    const result = await limiter.check("ip-1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different keys independently", async () => {
    await limiter.check("ip-1");
    await limiter.check("ip-1");
    await limiter.check("ip-1");

    const result = await limiter.check("ip-2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("resets after window expires", async () => {
    const shortLimiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 50 });
    await shortLimiter.check("ip-1");
    const blocked = await shortLimiter.check("ip-1");
    expect(blocked.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 60));
    const allowed = await shortLimiter.check("ip-1");
    expect(allowed.allowed).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test -- lib/__tests__/in-memory-rate-limiter.test.ts
```

**Step 3: Implement rate limiter**

Create `shareal-ink/lib/adapters/in-memory-rate-limiter.ts`:
```typescript
import type { IRateLimiter, RateLimitResult } from "@/lib/interfaces";

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export class InMemoryRateLimiter implements IRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(config?: RateLimiterConfig) {
    this.maxRequests = config?.maxRequests ?? parseInt(process.env.RATE_LIMIT_MAX ?? "20", 10);
    this.windowMs = config?.windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key) ?? { timestamps: [] };

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((t) => now - t < this.windowMs);

    if (entry.timestamps.length >= this.maxRequests) {
      const resetAt = entry.timestamps[0] + this.windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    entry.timestamps.push(now);
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.timestamps.length,
      resetAt: now + this.windowMs,
    };
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test -- lib/__tests__/in-memory-rate-limiter.test.ts
```

Expected: All PASS.

**Step 5: Create noop and passthrough adapters**

Create `shareal-ink/lib/adapters/noop-auth.ts`:
```typescript
import type { IAuthProvider } from "@/lib/interfaces";
import type { AuthUser } from "@/lib/types";

export class NoopAuthProvider implements IAuthProvider {
  async getCurrentUser(): Promise<AuthUser> {
    return { userId: "anonymous", isAuthenticated: false };
  }
}
```

Create `shareal-ink/lib/adapters/noop-analytics.ts`:
```typescript
import type { IAnalytics } from "@/lib/interfaces";
import type { AnalyticsEvent } from "@/lib/types";

export class NoopAnalytics implements IAnalytics {
  track(_event: AnalyticsEvent): void {
    // No-op. Swap with PostHog/Mixpanel adapter when ready.
  }
}
```

Create `shareal-ink/lib/adapters/passthrough-image-store.ts`:
```typescript
import type { IImageStore } from "@/lib/interfaces";

export class PassthroughImageStore implements IImageStore {
  async store(imageUrl: string): Promise<string> {
    // Pass through OG image URL directly. Swap with S3/R2 upload when ready.
    return imageUrl;
  }
}
```

Create `shareal-ink/lib/adapters/index.ts`:
```typescript
export { RegexLinkDetector } from "./regex-link-detector";
export { InMemoryRateLimiter } from "./in-memory-rate-limiter";
export { NoopAuthProvider } from "./noop-auth";
export { NoopAnalytics } from "./noop-analytics";
export { PassthroughImageStore } from "./passthrough-image-store";
```

**Step 6: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/lib/adapters/ shareal-ink/lib/__tests__/in-memory-rate-limiter.test.ts
git commit -m "feat: add rate limiter, noop auth, noop analytics, passthrough image store"
```

---

## Task 7: Redis, BullMQ Adapter, OG Fetcher Adapter & Container

**Files:**
- Create: `shareal-ink/lib/redis.ts`
- Create: `shareal-ink/lib/adapters/bullmq-adapter.ts`
- Create: `shareal-ink/lib/adapters/metascraper-og-fetcher.ts`
- Create: `shareal-ink/lib/worker.ts`
- Create: `shareal-ink/lib/container.ts`

**Step 1: Create Redis connection**

Create `shareal-ink/lib/redis.ts`:
```typescript
import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

function createRedisConnection(): IORedis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL environment variable is required");
  }
  return new IORedis(url, { maxRetriesPerRequest: null });
}

export const redis = globalForRedis.redis ?? createRedisConnection();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
```

**Step 2: Create BullMQ adapter**

Create `shareal-ink/lib/adapters/bullmq-adapter.ts`:
```typescript
import { Queue } from "bullmq";
import type { IQueue } from "@/lib/interfaces";
import { redis } from "@/lib/redis";

const QUEUE_NAME = "og-fetch";

const globalForQueue = globalThis as unknown as {
  bullmqQueue: Queue | undefined;
};

function getQueue(): Queue {
  if (!globalForQueue.bullmqQueue) {
    globalForQueue.bullmqQueue = new Queue(QUEUE_NAME, { connection: redis });
  }
  return globalForQueue.bullmqQueue;
}

export class BullMQAdapter implements IQueue {
  async enqueue(jobName: string, data: Record<string, unknown>): Promise<string> {
    const queue = getQueue();
    const job = await queue.add(jobName, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
    return job.id!;
  }

  async close(): Promise<void> {
    const queue = getQueue();
    await queue.close();
  }
}
```

**Step 3: Create metascraper OG fetcher**

Create `shareal-ink/lib/adapters/metascraper-og-fetcher.ts`:
```typescript
import type { IOgFetcher } from "@/lib/interfaces";
import type { OgMetadata } from "@/lib/types";

// Dynamic imports to avoid bundling issues — these are server-only
async function createScraper() {
  const metascraper = (await import("metascraper")).default;
  const title = (await import("metascraper-title")).default;
  const description = (await import("metascraper-description")).default;
  const image = (await import("metascraper-image")).default;
  return metascraper([title(), description(), image()]);
}

export class MetascraperOgFetcher implements IOgFetcher {
  async fetch(url: string): Promise<OgMetadata> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SharealBot/1.0; +https://shareal.ink)",
        },
      });
      const html = await response.text();
      const scraper = await createScraper();
      const metadata = await scraper({ html, url });

      return {
        title: metadata.title || null,
        description: metadata.description || null,
        imageUrl: metadata.image || null,
      };
    } catch {
      // Extract hostname as fallback title
      try {
        const hostname = new URL(url).hostname.replace("www.", "");
        return { title: hostname, description: null, imageUrl: null };
      } catch {
        return { title: null, description: null, imageUrl: null };
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

**Step 4: Create BullMQ worker**

Create `shareal-ink/lib/worker.ts`:
```typescript
import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { MetascraperOgFetcher } from "@/lib/adapters/metascraper-og-fetcher";

const QUEUE_NAME = "og-fetch";
const fetcher = new MetascraperOgFetcher();

const globalForWorker = globalThis as unknown as {
  ogWorker: Worker | undefined;
};

function ensureWorker(): Worker {
  if (globalForWorker.ogWorker) return globalForWorker.ogWorker;

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { ogJobId, url } = job.data as { ogJobId: string; url: string };

      const metadata = await fetcher.fetch(url);

      // Update OgJob
      await prisma.ogJob.update({
        where: { id: ogJobId },
        data: {
          status: metadata.title ? "completed" : "failed",
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          error: metadata.title ? null : "Failed to extract metadata",
          completedAt: new Date(),
        },
      });

      // If a Space already references this OgJob, enrich it
      await prisma.space.updateMany({
        where: { ogJobId },
        data: {
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
        },
      });

      return metadata;
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`OG fetch job ${job?.id} failed:`, err.message);
  });

  globalForWorker.ogWorker = worker;
  return worker;
}

export function getWorker(): Worker {
  return ensureWorker();
}
```

**Step 5: Create container (wiring)**

Create `shareal-ink/lib/container.ts`:
```typescript
import { BullMQAdapter } from "@/lib/adapters/bullmq-adapter";
import { RegexLinkDetector } from "@/lib/adapters/regex-link-detector";
import { InMemoryRateLimiter } from "@/lib/adapters/in-memory-rate-limiter";
import { NoopAuthProvider } from "@/lib/adapters/noop-auth";
import { NoopAnalytics } from "@/lib/adapters/noop-analytics";
import { PassthroughImageStore } from "@/lib/adapters/passthrough-image-store";
import { MetascraperOgFetcher } from "@/lib/adapters/metascraper-og-fetcher";
import type { IOgFetcher, IQueue, IAuthProvider, IAnalytics, IRateLimiter, ILinkDetector, IImageStore } from "@/lib/interfaces";

export const ogFetcher: IOgFetcher = new MetascraperOgFetcher();
export const queue: IQueue = new BullMQAdapter();
export const auth: IAuthProvider = new NoopAuthProvider();
export const analytics: IAnalytics = new NoopAnalytics();
export const rateLimiter: IRateLimiter = new InMemoryRateLimiter();
export const linkDetector: ILinkDetector = new RegexLinkDetector();
export const imageStore: IImageStore = new PassthroughImageStore();
```

**Step 6: Update adapters index**

Add new adapters to `shareal-ink/lib/adapters/index.ts`:
```typescript
export { RegexLinkDetector } from "./regex-link-detector";
export { InMemoryRateLimiter } from "./in-memory-rate-limiter";
export { NoopAuthProvider } from "./noop-auth";
export { NoopAnalytics } from "./noop-analytics";
export { PassthroughImageStore } from "./passthrough-image-store";
export { BullMQAdapter } from "./bullmq-adapter";
export { MetascraperOgFetcher } from "./metascraper-og-fetcher";
```

**Step 7: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

Note: Build may warn about missing env vars — that's fine. It should compile.

**Step 8: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/lib/redis.ts shareal-ink/lib/worker.ts shareal-ink/lib/container.ts shareal-ink/lib/adapters/bullmq-adapter.ts shareal-ink/lib/adapters/metascraper-og-fetcher.ts shareal-ink/lib/adapters/index.ts
git commit -m "feat: add Redis, BullMQ, metascraper adapters and container wiring"
```

---

## Task 8: API Routes

**Files:**
- Create: `shareal-ink/lib/validation.ts`
- Create: `shareal-ink/app/api/og/route.ts`
- Create: `shareal-ink/app/api/og/[jobId]/route.ts`
- Create: `shareal-ink/app/api/spaces/route.ts`
- Create: `shareal-ink/app/api/spaces/[token]/route.ts`
- Create: `shareal-ink/app/api/spaces/[token]/respond/route.ts`
- Create: `shareal-ink/lib/__tests__/validation.test.ts`

**Step 1: Write failing test for input validation**

Create `shareal-ink/lib/__tests__/validation.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseInput } from "@/lib/validation";

describe("parseInput", () => {
  it("parses a valid HTTP URL", () => {
    const result = parseInput("https://maps.google.com/place");
    expect(result.type).toBe("url");
    expect(result.value).toBe("https://maps.google.com/place");
  });

  it("parses a valid HTTP URL with whitespace", () => {
    const result = parseInput("  https://youtube.com/watch?v=abc  ");
    expect(result.type).toBe("url");
    expect(result.value).toBe("https://youtube.com/watch?v=abc");
  });

  it("parses free text", () => {
    const result = parseInput("Pizza tonight?");
    expect(result.type).toBe("text");
    expect(result.value).toBe("Pizza tonight?");
  });

  it("rejects empty input", () => {
    const result = parseInput("   ");
    expect(result.type).toBe("empty");
  });

  it("rejects non-http schemes", () => {
    const result = parseInput("javascript:alert(1)");
    expect(result.type).toBe("text");
  });

  it("rejects ftp schemes as text", () => {
    const result = parseInput("ftp://files.example.com");
    expect(result.type).toBe("text");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test -- lib/__tests__/validation.test.ts
```

**Step 3: Implement validation**

Create `shareal-ink/lib/validation.ts`:
```typescript
type ParsedInput =
  | { type: "url"; value: string }
  | { type: "text"; value: string }
  | { type: "empty" };

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) return { type: "empty" };

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { type: "url", value: trimmed };
    }
    // Non-http scheme — treat as text
    return { type: "text", value: trimmed };
  } catch {
    return { type: "text", value: trimmed };
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test -- lib/__tests__/validation.test.ts
```

Expected: All PASS.

**Step 5: Create POST /api/og route**

Create `shareal-ink/app/api/og/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queue, linkDetector, rateLimiter, analytics } from "@/lib/container";
import { parseInput } from "@/lib/validation";
import { getWorker } from "@/lib/worker";

// Ensure worker is running
getWorker();

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await rateLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.input || typeof body.input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const parsed = parseInput(body.input);
  if (parsed.type === "empty") {
    return NextResponse.json({ error: "Input cannot be empty" }, { status: 400 });
  }

  const detection = parsed.type === "url"
    ? linkDetector.detect(parsed.value)
    : { linkType: "generic" as const, suggestedActionLabel: "Interested" };

  if (parsed.type === "text") {
    // No OG job for free text
    analytics.track({ name: "og_skipped", properties: { reason: "free_text" } });
    return NextResponse.json({
      jobId: null,
      linkType: detection.linkType,
      suggestedActionLabel: detection.suggestedActionLabel,
      title: parsed.value,
    });
  }

  // Create OgJob and enqueue
  const ogJob = await prisma.ogJob.create({
    data: {
      url: parsed.value,
      linkType: detection.linkType,
    },
  });

  await queue.enqueue("og-fetch", { ogJobId: ogJob.id, url: parsed.value });
  analytics.track({ name: "og_job_created", properties: { linkType: detection.linkType } });

  return NextResponse.json({
    jobId: ogJob.id,
    linkType: detection.linkType,
    suggestedActionLabel: detection.suggestedActionLabel,
    title: null,
  });
}
```

**Step 6: Create GET /api/og/[jobId] route**

Create `shareal-ink/app/api/og/[jobId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await prisma.ogJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    metadata: job.status === "completed"
      ? { title: job.title, description: job.description, imageUrl: job.imageUrl }
      : null,
    linkType: job.linkType,
    error: job.error,
  });
}
```

**Step 7: Create POST /api/spaces route**

Create `shareal-ink/app/api/spaces/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSpaceToken } from "@/lib/tokens";
import { rateLimiter, auth, analytics } from "@/lib/container";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await rateLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { url, jobId, title, description, linkType, primaryActionLabel } = body;

  if (!linkType || !primaryActionLabel) {
    return NextResponse.json({ error: "linkType and primaryActionLabel are required" }, { status: 400 });
  }

  // If there's a jobId, try to pull completed metadata from OgJob
  let ogTitle = title;
  let ogDescription = description;
  let ogImageUrl: string | null = null;

  if (jobId) {
    const ogJob = await prisma.ogJob.findUnique({ where: { id: jobId } });
    if (ogJob?.status === "completed") {
      ogTitle = ogTitle ?? ogJob.title;
      ogDescription = ogDescription ?? ogJob.description;
      ogImageUrl = ogJob.imageUrl;
    }
  }

  const user = await auth.getCurrentUser();
  const token = createSpaceToken();

  const space = await prisma.space.create({
    data: {
      token,
      originalUrl: url || null,
      title: ogTitle || null,
      description: ogDescription || null,
      imageUrl: ogImageUrl,
      linkType,
      primaryActionLabel,
      ogJobId: jobId || null,
      creatorUserId: user.isAuthenticated ? user.userId : null,
    },
  });

  analytics.track({ name: "space_created", properties: { linkType, hasOg: !!ogTitle } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink";
  return NextResponse.json({ token: space.token, url: `${appUrl}/${space.token}` });
}
```

**Step 8: Create GET /api/spaces/[token] route**

Create `shareal-ink/app/api/spaces/[token]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const space = await prisma.space.findUnique({
    where: { token },
    include: { _count: { select: { responses: { where: { responseType: "yes" } } } } },
  });

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  return NextResponse.json({
    token: space.token,
    originalUrl: space.originalUrl,
    title: space.title,
    description: space.description,
    imageUrl: space.imageUrl,
    linkType: space.linkType,
    intentType: space.intentType,
    primaryActionLabel: space.primaryActionLabel,
    createdAt: space.createdAt,
    responseCount: space._count.responses,
  });
}
```

**Step 9: Create POST /api/spaces/[token]/respond route**

Create `shareal-ink/app/api/spaces/[token]/respond/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimiter, analytics } from "@/lib/container";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await rateLimiter.check(`respond:${ip}:${token}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const space = await prisma.space.findUnique({ where: { token } });
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const responseType = body?.responseType === "no" ? "no" : "yes";

  await prisma.response.create({
    data: { spaceId: space.id, responseType },
  });

  const count = await prisma.response.count({
    where: { spaceId: space.id, responseType: "yes" },
  });

  analytics.track({ name: "space_responded", properties: { token, responseType } });

  return NextResponse.json({ count });
}
```

**Step 10: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

**Step 11: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/lib/validation.ts shareal-ink/lib/__tests__/validation.test.ts shareal-ink/app/api/
git commit -m "feat: add all API routes with rate limiting and validation"
```

---

## Task 9: UI Components — Base (Button, Input, Skeleton, TypeBadge)

**Files:**
- Create: `shareal-ink/components/ui/button.tsx`
- Create: `shareal-ink/components/ui/input.tsx`
- Create: `shareal-ink/components/ui/skeleton.tsx`
- Create: `shareal-ink/components/ui/type-badge.tsx`

**Step 1: Create Button component**

Create `shareal-ink/components/ui/button.tsx`:
```tsx
"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover shadow-sm",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-gray-50",
  ghost:
    "text-muted hover:text-foreground hover:bg-gray-100",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-medium transition-colors",
          "min-h-[48px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
```

**Step 2: Create Input component**

Create `shareal-ink/components/ui/input.tsx`:
```tsx
"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "w-full rounded-[var(--radius-lg)] border bg-surface px-5 py-4 text-base shadow-sm transition-colors",
            "placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
            error ? "border-red-400" : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
```

**Step 3: Create Skeleton component**

Create `shareal-ink/components/ui/skeleton.tsx`:
```tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-gray-200", className)}
    />
  );
}
```

**Step 4: Create TypeBadge component**

Create `shareal-ink/components/ui/type-badge.tsx`:
```tsx
import { cn } from "@/lib/utils";
import type { LinkType } from "@/lib/types";

const badgeConfig: Record<LinkType, { label: string; className: string }> = {
  restaurant: { label: "Restaurant", className: "bg-orange-100 text-orange-700" },
  video: { label: "Video", className: "bg-purple-100 text-purple-700" },
  event: { label: "Event", className: "bg-blue-100 text-blue-700" },
  generic: { label: "Link", className: "bg-gray-100 text-gray-600" },
};

interface TypeBadgeProps {
  linkType: LinkType;
  className?: string;
}

export function TypeBadge({ linkType, className }: TypeBadgeProps) {
  const config = badgeConfig[linkType];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
```

**Step 5: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

**Step 6: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/components/ui/
git commit -m "feat: add base UI components — Button, Input, Skeleton, TypeBadge"
```

---

## Task 10: Create Flow — CreateForm & LinkPreview

**Files:**
- Create: `shareal-ink/components/create/create-form.tsx`
- Create: `shareal-ink/components/create/link-preview.tsx`

**Step 1: Create LinkPreview component**

Create `shareal-ink/components/create/link-preview.tsx`:
```tsx
"use client";

import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { LinkType, OgMetadata } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

interface LinkPreviewProps {
  linkType: LinkType;
  metadata: OgMetadata | null;
  loading: boolean;
  title: string | null;
}

export function LinkPreview({ linkType, metadata, loading, title }: LinkPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const displayTitle = metadata?.title ?? title;
  const displayDescription = metadata?.description;
  const imageUrl = metadata?.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm"
    >
      {/* Image */}
      {loading && !imageUrl ? (
        <Skeleton className="h-40 w-full rounded-none" />
      ) : imageUrl && !imageError ? (
        <div className="relative h-40 w-full">
          <Image
            src={imageUrl}
            alt={displayTitle ?? "Preview"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        </div>
      ) : null}

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <TypeBadge linkType={linkType} />
        </div>

        {loading && !displayTitle ? (
          <>
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            {displayTitle && (
              <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-2">
                {displayTitle}
              </h3>
            )}
            {displayDescription && (
              <p className="text-sm text-muted line-clamp-2">{displayDescription}</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
```

**Step 2: Create CreateForm component**

Create `shareal-ink/components/create/create-form.tsx`:
```tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinkPreview } from "./link-preview";
import type { LinkType, OgMetadata } from "@/lib/types";

type FormState = "idle" | "fetching" | "previewing" | "creating";

export function CreateForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<LinkType>("generic");
  const [actionLabel, setActionLabel] = useState("Interested");
  const [metadata, setMetadata] = useState<OgMetadata | null>(null);
  const [freeTextTitle, setFreeTextTitle] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const pollOgJob = useCallback(
    (id: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/og/${id}`);
          if (!res.ok) return;
          const data = await res.json();

          if (data.status === "completed" && data.metadata) {
            setMetadata(data.metadata);
            setState("previewing");
            stopPolling();
          } else if (data.status === "failed") {
            setState("previewing");
            stopPolling();
          }
        } catch {
          // Silently continue polling
        }
      }, 1500);
    },
    [stopPolling]
  );

  const handleSubmitInput = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Paste a link or type a title");
      return;
    }

    setError(null);
    setState("fetching");
    setMetadata(null);
    setFreeTextTitle(null);

    try {
      const res = await fetch("/api/og", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a moment.");
        setState("idle");
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Try again.");
        setState("idle");
        return;
      }

      const data = await res.json();
      setLinkType(data.linkType);
      setActionLabel(data.suggestedActionLabel);

      if (data.jobId) {
        setJobId(data.jobId);
        setState("fetching");
        pollOgJob(data.jobId);
      } else {
        // Free text — no OG to fetch
        setFreeTextTitle(data.title);
        setState("previewing");
      }
    } catch {
      setError("Network error. Check your connection.");
      setState("idle");
    }
  };

  const handleCreate = async () => {
    setState("creating");
    stopPolling();

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: freeTextTitle ? null : input.trim(),
          jobId,
          title: metadata?.title ?? freeTextTitle,
          description: metadata?.description ?? null,
          linkType,
          primaryActionLabel: actionLabel,
        }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a moment.");
        setState("previewing");
        return;
      }

      if (!res.ok) {
        setError("Failed to create. Try again.");
        setState("previewing");
        return;
      }

      const data = await res.json();
      router.push(`/${data.token}`);
    } catch {
      setError("Network error. Check your connection.");
      setState("previewing");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (state === "idle" || state === "fetching") {
        handleSubmitInput();
      }
    }
  };

  const showPreview = state !== "idle";
  const canCreate = state === "fetching" || state === "previewing";

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (state !== "idle") {
              setState("idle");
              stopPolling();
              setMetadata(null);
              setJobId(null);
              setFreeTextTitle(null);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a link or type anything..."
          error={error ?? undefined}
          disabled={state === "creating"}
          autoFocus
        />
        {state === "idle" && input.trim() && (
          <Button onClick={handleSubmitInput} variant="secondary" className="shrink-0">
            Preview
          </Button>
        )}
      </div>

      {showPreview && (
        <LinkPreview
          linkType={linkType}
          metadata={metadata}
          loading={state === "fetching"}
          title={freeTextTitle}
        />
      )}

      {canCreate && (
        <Button
          onClick={handleCreate}
          loading={state === "creating"}
          className="w-full text-base"
        >
          Create shareable link
        </Button>
      )}
    </div>
  );
}
```

**Step 3: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

**Step 4: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/components/create/
git commit -m "feat: add CreateForm and LinkPreview components"
```

---

## Task 11: Surface Components & Surface Page

**Files:**
- Create: `shareal-ink/components/surface/hero-image.tsx`
- Create: `shareal-ink/components/surface/action-button.tsx`
- Create: `shareal-ink/components/surface/response-counter.tsx`
- Create: `shareal-ink/components/surface/secondary-actions.tsx`
- Create: `shareal-ink/components/surface/surface-card.tsx`
- Create: `shareal-ink/app/[token]/page.tsx`

**Step 1: Create HeroImage**

Create `shareal-ink/components/surface/hero-image.tsx`:
```tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { LinkType } from "@/lib/types";

const gradients: Record<LinkType, string> = {
  restaurant: "from-orange-200 to-amber-100",
  video: "from-purple-200 to-indigo-100",
  event: "from-blue-200 to-cyan-100",
  generic: "from-gray-200 to-slate-100",
};

interface HeroImageProps {
  imageUrl: string | null;
  title: string | null;
  linkType: LinkType;
}

export function HeroImage({ imageUrl, title, linkType }: HeroImageProps) {
  const [error, setError] = useState(false);

  if (!imageUrl || error) {
    return (
      <div
        className={`h-48 w-full rounded-t-[var(--radius-lg)] bg-gradient-to-br ${gradients[linkType]}`}
      />
    );
  }

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-t-[var(--radius-lg)]">
      <Image
        src={imageUrl}
        alt={title ?? "Surface image"}
        fill
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
        priority
      />
    </div>
  );
}
```

**Step 2: Create ActionButton**

Create `shareal-ink/components/surface/action-button.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ActionButtonProps {
  token: string;
  label: string;
  initialCount: number;
  onCountChange: (count: number) => void;
}

export function ActionButton({ token, label, initialCount, onCountChange }: ActionButtonProps) {
  const [responded, setResponded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`shareal:${token}`);
    if (stored === "yes") setResponded(true);
  }, [token]);

  const handleClick = async () => {
    if (responded || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/spaces/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseType: "yes" }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponded(true);
        localStorage.setItem(`shareal:${token}`, "yes");
        onCountChange(data.count);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  if (responded) {
    return (
      <Button disabled variant="primary" className="w-full bg-success text-white text-base">
        <Check className="h-5 w-5" />
        You&apos;re in!
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} loading={loading} className="w-full text-base">
      {label}
    </Button>
  );
}
```

**Step 3: Create ResponseCounter**

Create `shareal-ink/components/surface/response-counter.tsx`:
```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";

interface ResponseCounterProps {
  count: number;
}

export function ResponseCounter({ count }: ResponseCounterProps) {
  if (count === 0) return null;

  const label = count === 1 ? "person is in" : "people are in";

  return (
    <div className="text-center text-sm text-muted">
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.3 }}
        >
          {count} {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
```

**Step 4: Create SecondaryActions**

Create `shareal-ink/components/surface/secondary-actions.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Share2 } from "lucide-react";

interface SecondaryActionsProps {
  originalUrl: string | null;
  shareUrl: string;
  title: string | null;
}

export function SecondaryActions({ originalUrl, shareUrl, title }: SecondaryActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? "shareal.ink", url: shareUrl });
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex gap-2">
      {originalUrl && (
        <Button variant="secondary" className="flex-1" asChild>
          <a href={originalUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open link
          </a>
        </Button>
      )}
      <Button variant="secondary" className="flex-1" onClick={handleCopy}>
        <Copy className="h-4 w-4" />
        {copied ? "Copied!" : "Copy link"}
      </Button>
      <Button variant="ghost" className="flex-1" onClick={handleShare}>
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
```

Note: The `asChild` prop on Button won't work with motion.button. The implementing engineer should handle this by making the "Open link" button a plain `<a>` styled like a button, or adjust the Button component to support `asChild` via Slot pattern. Simplest fix: just use a regular anchor styled with the same classes.

**Step 5: Create SurfaceCard**

Create `shareal-ink/components/surface/surface-card.tsx`:
```tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { HeroImage } from "./hero-image";
import { ActionButton } from "./action-button";
import { ResponseCounter } from "./response-counter";
import { SecondaryActions } from "./secondary-actions";
import { TypeBadge } from "@/components/ui/type-badge";
import type { SpaceData } from "@/lib/types";

interface SurfaceCardProps {
  space: SpaceData;
}

export function SurfaceCard({ space }: SurfaceCardProps) {
  const [count, setCount] = useState(space.responseCount);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink"}/${space.token}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm"
    >
      <HeroImage
        imageUrl={space.imageUrl}
        title={space.title}
        linkType={space.linkType}
      />

      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {space.title && (
              <motion.h1
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="text-xl font-bold text-foreground"
              >
                {space.title}
              </motion.h1>
            )}
            {space.description && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="mt-1 text-sm text-muted line-clamp-3"
              >
                {space.description}
              </motion.p>
            )}
          </div>
          <TypeBadge linkType={space.linkType} className="ml-3 shrink-0" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <ActionButton
            token={space.token}
            label={space.primaryActionLabel}
            initialCount={count}
            onCountChange={setCount}
          />
        </motion.div>

        <ResponseCounter count={count} />

        <SecondaryActions
          originalUrl={space.originalUrl}
          shareUrl={shareUrl}
          title={space.title}
        />
      </div>
    </motion.div>
  );
}
```

**Step 6: Create surface page**

Create `shareal-ink/app/[token]/page.tsx`:
```tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SurfaceCard } from "@/components/surface/surface-card";
import type { Metadata } from "next";
import type { SpaceData, LinkType, IntentType } from "@/lib/types";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const space = await prisma.space.findUnique({ where: { token } });

  if (!space) return { title: "Not found — shareal.ink" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink";

  return {
    title: space.title ? `${space.title} — shareal.ink` : "shareal.ink",
    description: space.description ?? "Shared on shareal.ink",
    openGraph: {
      title: space.title ?? "shareal.ink",
      description: space.description ?? "Shared on shareal.ink",
      images: space.imageUrl ? [{ url: space.imageUrl }] : [],
      url: `${appUrl}/${token}`,
      type: "website",
    },
    twitter: {
      card: space.imageUrl ? "summary_large_image" : "summary",
      title: space.title ?? "shareal.ink",
      description: space.description ?? "Shared on shareal.ink",
    },
  };
}

export default async function SurfacePage({ params }: PageProps) {
  const { token } = await params;

  const space = await prisma.space.findUnique({
    where: { token },
    include: { _count: { select: { responses: { where: { responseType: "yes" } } } } },
  });

  if (!space) notFound();

  const spaceData: SpaceData = {
    token: space.token,
    originalUrl: space.originalUrl,
    title: space.title,
    description: space.description,
    imageUrl: space.imageUrl,
    linkType: space.linkType as LinkType,
    intentType: space.intentType as IntentType,
    primaryActionLabel: space.primaryActionLabel,
    createdAt: space.createdAt,
    responseCount: space._count.responses,
  };

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12">
      <SurfaceCard space={spaceData} />
    </main>
  );
}
```

**Step 7: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

**Step 8: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/components/surface/ shareal-ink/app/\[token\]/
git commit -m "feat: add surface components and surface page with dynamic OG metadata"
```

---

## Task 12: Pages — Homepage, 404, Loading & Final Wiring

**Files:**
- Modify: `shareal-ink/app/page.tsx`
- Create: `shareal-ink/app/not-found.tsx`
- Create: `shareal-ink/app/loading.tsx`
- Create: `shareal-ink/components/layout/logo.tsx`

**Step 1: Create Logo component**

Create `shareal-ink/components/layout/logo.tsx`:
```tsx
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={cn("text-lg font-bold tracking-tight text-foreground", className)}>
      shareal<span className="text-accent">.ink</span>
    </span>
  );
}
```

**Step 2: Update homepage**

Replace `shareal-ink/app/page.tsx`:
```tsx
import { CreateForm } from "@/components/create/create-form";
import { Logo } from "@/components/layout/logo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-2">
          <Logo className="text-2xl" />
          <p className="text-muted">Share a link. Make it make sense.</p>
        </div>
        <CreateForm />
      </div>
    </main>
  );
}
```

**Step 3: Create 404 page**

Create `shareal-ink/app/not-found.tsx`:
```tsx
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-6 text-2xl" />
      <h1 className="mb-2 text-xl font-semibold text-foreground">This link doesn&apos;t exist</h1>
      <p className="mb-6 text-muted">It may have been removed, or the URL might be wrong.</p>
      <Link href="/">
        <Button>Create your own</Button>
      </Link>
    </main>
  );
}
```

**Step 4: Create loading page**

Create `shareal-ink/app/loading.tsx`:
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </main>
  );
}
```

**Step 5: Run all tests**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run test
```

Expected: All tests pass (link detector, tokens, rate limiter, validation).

**Step 6: Verify build**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth/shareal-ink
bun run build
```

Expected: Build succeeds. There may be runtime warnings about Redis/DB not being available — that's expected without the infrastructure running.

**Step 7: Commit**

```bash
cd /Users/vladimirtrifonov/src/ai/shareal.ink/.claude/worktrees/compassionate-booth
git add shareal-ink/app/page.tsx shareal-ink/app/not-found.tsx shareal-ink/app/loading.tsx shareal-ink/components/layout/
git commit -m "feat: add homepage, 404, loading page and logo component"
```

---

## Verification Checklist

After all tasks are complete, run through this checklist:

1. `bun run test` — all unit tests pass
2. `bun run build` — compiles without errors
3. Start Postgres locally (Docker): `docker run --name shareal-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shareal_ink -p 5432:5432 -d postgres:16-alpine`
4. Start Redis locally: `docker run --name shareal-redis -p 6379:6379 -d redis:7-alpine`
5. Create `.env` from `.env.example`, run `bunx prisma migrate dev --name init`
6. `bun run dev` — start dev server
7. Open `http://localhost:3000` — see homepage with input field
8. Paste a Google Maps URL → preview appears → create → surface with "I'm in!"
9. Paste a YouTube URL → "Video" badge → "I'll watch it" button
10. Type "Pizza tonight?" → generic surface with text as title
11. Click RSVP → count increments → button changes to "You're in!"
12. Revisit → localStorage shows responded state
13. View page source on surface → `og:title`, `og:image` meta tags present
