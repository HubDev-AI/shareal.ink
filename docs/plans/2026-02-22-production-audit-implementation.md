# Production Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical and high-severity findings from the production audit before deploying shareal.ink

**Architecture:** Utility-first approach — create shared helpers (`lib/security.ts`, `lib/api-helpers.ts`) used by multiple routes and components. Security fixes first, then reliability, then optimization.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5.9, Prisma 7, BullMQ, Vitest

---

## Task 1: SSRF Protection for OG Fetcher (C1)

**Files:**
- Create: `lib/security.ts`
- Create: `lib/__tests__/security.test.ts`
- Modify: `lib/adapters/metascraper-og-fetcher.ts:19-20`

**Step 1: Write the failing tests**

Create `lib/__tests__/security.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { isUrlSafe } from "@/lib/security";

describe("isUrlSafe", () => {
  it("allows https URLs to public hosts", () => {
    expect(isUrlSafe("https://example.com")).toBe(true);
    expect(isUrlSafe("https://www.youtube.com/watch?v=abc")).toBe(true);
  });

  it("allows http URLs to public hosts", () => {
    expect(isUrlSafe("http://example.com")).toBe(true);
  });

  it("blocks cloud metadata endpoint", () => {
    expect(isUrlSafe("http://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("blocks localhost", () => {
    expect(isUrlSafe("http://localhost:3000")).toBe(false);
    expect(isUrlSafe("http://127.0.0.1")).toBe(false);
    expect(isUrlSafe("http://[::1]")).toBe(false);
  });

  it("blocks private IP ranges", () => {
    expect(isUrlSafe("http://10.0.0.1")).toBe(false);
    expect(isUrlSafe("http://192.168.1.1")).toBe(false);
    expect(isUrlSafe("http://172.16.0.1")).toBe(false);
  });

  it("blocks non-http protocols", () => {
    expect(isUrlSafe("ftp://example.com")).toBe(false);
    expect(isUrlSafe("file:///etc/passwd")).toBe(false);
    expect(isUrlSafe("javascript:alert(1)")).toBe(false);
  });

  it("blocks invalid URLs", () => {
    expect(isUrlSafe("not-a-url")).toBe(false);
    expect(isUrlSafe("")).toBe(false);
  });

  it("blocks 0.0.0.0", () => {
    expect(isUrlSafe("http://0.0.0.0")).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun run test -- lib/__tests__/security.test.ts`
Expected: FAIL — `isUrlSafe` not found

**Step 3: Implement `lib/security.ts`**

```typescript
const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // loopback
  /^10\./,                           // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./,     // 172.16.0.0/12
  /^192\.168\./,                     // 192.168.0.0/16
  /^169\.254\./,                     // link-local
  /^0\./,                            // 0.0.0.0/8
];

function isPrivateIp(ip: string): boolean {
  if (ip === "0.0.0.0" || ip === "::1" || ip === "::") return true;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

export function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;

    // Block localhost
    if (hostname === "localhost" || hostname === "[::1]") return false;

    // Strip brackets from IPv6
    const bare = hostname.replace(/^\[|\]$/g, "");
    if (isPrivateIp(bare)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is safe to render as an href attribute.
 * Only allows http: and https: protocols.
 */
export function sanitizeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test -- lib/__tests__/security.test.ts`
Expected: PASS

**Step 5: Wire `isUrlSafe` into the OG fetcher**

In `lib/adapters/metascraper-og-fetcher.ts`, add import and guard before fetch:

```typescript
// Add at top:
import { isUrlSafe } from "@/lib/security";

// Replace line 20 (`const response = await globalThis.fetch(url, {`)
// with a guard before it:
    if (!isUrlSafe(url)) {
      return { title: null, description: null, imageUrl: null };
    }

    const response = await globalThis.fetch(url, {
```

**Step 6: Run all tests**

Run: `bun run test`
Expected: All pass

**Step 7: Commit**

```bash
git add lib/security.ts lib/__tests__/security.test.ts lib/adapters/metascraper-og-fetcher.ts
git commit -m "fix(security): add SSRF protection to OG fetcher

Validate URLs against private/reserved IP ranges before fetching.
Block localhost, link-local, cloud metadata, and non-http protocols."
```

---

## Task 2: Stored XSS Prevention — `sanitizeHref` + URL Protocol Validation (C6)

**Files:**
- Modify: `lib/security.ts` (already has `sanitizeHref` from Task 1)
- Modify: `lib/__tests__/security.test.ts`
- Modify: `app/api/spaces/route.ts:51`
- Modify: `components/surface/shared/truncated-text.tsx:28`
- Modify: `components/surface/shared/hero-image.tsx:23,63`
- Modify: `components/surface/shared/secondary-actions.tsx:32`
- Modify: `components/surface/renderers/pdf-renderer.tsx:12`

**Step 1: Add `sanitizeHref` tests**

Append to `lib/__tests__/security.test.ts`:

```typescript
import { isUrlSafe, sanitizeHref } from "@/lib/security";

describe("sanitizeHref", () => {
  it("allows http and https URLs", () => {
    expect(sanitizeHref("https://example.com")).toBe("https://example.com");
    expect(sanitizeHref("http://example.com")).toBe("http://example.com");
  });

  it("blocks javascript: URIs", () => {
    expect(sanitizeHref("javascript:alert(1)")).toBeNull();
    expect(sanitizeHref("JAVASCRIPT:alert(document.cookie)")).toBeNull();
  });

  it("blocks data: URIs", () => {
    expect(sanitizeHref("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("returns null for null/undefined/empty", () => {
    expect(sanitizeHref(null)).toBeNull();
    expect(sanitizeHref(undefined)).toBeNull();
    expect(sanitizeHref("")).toBeNull();
  });

  it("blocks vbscript: URIs", () => {
    expect(sanitizeHref("vbscript:MsgBox(1)")).toBeNull();
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `bun run test -- lib/__tests__/security.test.ts`
Expected: PASS (sanitizeHref already implemented in Task 1)

**Step 3: Add URL protocol validation in `/api/spaces` POST**

In `app/api/spaces/route.ts`, add validation after the `if (!linkType || !primaryActionLabel)` block:

```typescript
// Add import at top:
import { sanitizeHref } from "@/lib/security";

// After line 25 (the linkType/primaryActionLabel check), add:
  if (url && !sanitizeHref(url)) {
    return NextResponse.json(
      { error: "URL must use http or https protocol" },
      { status: 400 }
    );
  }
```

**Step 4: Add `sanitizeHref` to components rendering user URLs**

For each component, import and wrap the href prop:

**`components/surface/shared/truncated-text.tsx`:**
```typescript
// Add import:
import { sanitizeHref } from "@/lib/security";

// Line 27-28: change href usage:
  const safeHref = sanitizeHref(href);

  const content = safeHref ? (
    <a
      ref={textRef as React.Ref<HTMLAnchorElement>}
      href={safeHref}
```

**`components/surface/shared/hero-image.tsx`:**
```typescript
// Add import:
import { sanitizeHref } from "@/lib/security";

// After the props destructuring (line 16), add:
  const safeUrl = sanitizeHref(originalUrl);

// Replace all `originalUrl` references in JSX with `safeUrl`
// Lines 21-34 (fallback link): use safeUrl
// Lines 53, 61-63: use safeUrl
```

**`components/surface/shared/secondary-actions.tsx`:**
```typescript
// Add import:
import { sanitizeHref } from "@/lib/security";

// Line 12: after destructuring, add:
  const safeUrl = sanitizeHref(originalUrl);

// Line 31: change condition and href to use safeUrl
```

**`components/surface/renderers/pdf-renderer.tsx`:**
```typescript
// Add import:
import { sanitizeHref } from "@/lib/security";

// Line 8-9: after component declaration, add:
  const safeUrl = sanitizeHref(space.originalUrl);

// Line 12: change href to safeUrl ?? "#"
// Line 32 (TruncatedText): pass safeUrl as href
```

**Step 5: Run all tests and build**

Run: `bun run test && bun run build`
Expected: All pass, build clean

**Step 6: Commit**

```bash
git add lib/security.ts lib/__tests__/security.test.ts app/api/spaces/route.ts \
  components/surface/shared/truncated-text.tsx components/surface/shared/hero-image.tsx \
  components/surface/shared/secondary-actions.tsx components/surface/renderers/pdf-renderer.tsx
git commit -m "fix(security): prevent stored XSS via javascript: URIs

Validate URL protocol in /api/spaces POST (only http/https).
Add sanitizeHref() to all components rendering user-supplied URLs."
```

---

## Task 3: Input Validation on `/api/spaces` (H1)

**Files:**
- Modify: `app/api/spaces/route.ts:21-58`

**Step 1: Add enum and length validation**

In `app/api/spaces/route.ts`, after the protocol validation from Task 2, add:

```typescript
// Add imports at top:
import type { LinkType, IntentType } from "@/lib/types";

// Define allowlists (after imports):
const VALID_LINK_TYPES: LinkType[] = [
  "google_maps", "youtube", "instagram", "tiktok", "spotify",
  "x_twitter", "event", "pdf", "google_doc", "image", "generic",
];
const VALID_INTENT_TYPES: IntentType[] = ["meet", "vote", "share"];
const MAX_TITLE = 256;
const MAX_DESCRIPTION = 2000;
const MAX_INTENT_TEXT = 500;
const MAX_ACTION_LABEL = 100;

// After the URL protocol check, add:
  if (!VALID_LINK_TYPES.includes(linkType)) {
    return NextResponse.json({ error: "Invalid linkType" }, { status: 400 });
  }

  if (intentType && !VALID_INTENT_TYPES.includes(intentType)) {
    return NextResponse.json({ error: "Invalid intentType" }, { status: 400 });
  }

  if (title && typeof title === "string" && title.length > MAX_TITLE) {
    return NextResponse.json({ error: `Title too long (max ${MAX_TITLE})` }, { status: 400 });
  }

  if (description && typeof description === "string" && description.length > MAX_DESCRIPTION) {
    return NextResponse.json({ error: `Description too long (max ${MAX_DESCRIPTION})` }, { status: 400 });
  }

  if (intentText && typeof intentText === "string" && intentText.length > MAX_INTENT_TEXT) {
    return NextResponse.json({ error: `Intent text too long (max ${MAX_INTENT_TEXT})` }, { status: 400 });
  }

  if (primaryActionLabel.length > MAX_ACTION_LABEL) {
    return NextResponse.json({ error: `Action label too long (max ${MAX_ACTION_LABEL})` }, { status: 400 });
  }
```

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/api/spaces/route.ts
git commit -m "fix(validation): add enum and length validation to /api/spaces

Validate linkType and intentType against allowlists.
Enforce length limits: title(256), description(2000), intentText(500), actionLabel(100)."
```

---

## Task 4: Worker Fetch Error Handling (C4)

**Files:**
- Modify: `lib/worker.ts:18-34`

**Step 1: Wrap worker processor in try/catch**

In `lib/worker.ts`, replace the processor function body (lines 18-47):

```typescript
    async (job) => {
      const { ogJobId, url } = job.data as { ogJobId: string; url: string };

      try {
        const metadata = await fetcher.fetch(url);

        await prisma.ogJob.update({
          where: { id: ogJobId },
          data: {
            status: metadata.title ? "completed" : "failed",
            title: metadata.title,
            description: metadata.description,
            imageUrl: metadata.imageUrl,
            extras: metadata.extras ?? undefined,
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
            extras: metadata.extras ?? undefined,
          },
        });

        return metadata;
      } catch (err) {
        // Mark OgJob as failed so frontend stops polling
        await prisma.ogJob.update({
          where: { id: ogJobId },
          data: {
            status: "failed",
            error: err instanceof Error ? err.message : "Unknown error",
            completedAt: new Date(),
          },
        }).catch(() => {
          // If DB update also fails, log and let BullMQ handle retry
        });

        throw err; // Re-throw so BullMQ records the failure
      }
    },
```

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add lib/worker.ts
git commit -m "fix(worker): handle fetch failures gracefully

Wrap processor in try/catch. On failure, update OgJob to 'failed'
status so frontend polling terminates instead of looping forever."
```

---

## Task 5: Remove `getWorker()` from API Route (C2)

**Files:**
- Modify: `app/api/og/route.ts:6,10`

**Step 1: Remove the worker import and call**

In `app/api/og/route.ts`:

- Remove line 6: `import { getWorker } from "@/lib/worker";`
- Remove lines 9-10: the comment and `getWorker();` call

The worker will be started separately as a long-running process (see Task 6).

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/api/og/route.ts
git commit -m "fix(arch): remove getWorker() from serverless API route

BullMQ workers are long-lived and incompatible with Vercel's ephemeral
serverless functions. Worker must run as a separate process."
```

---

## Task 6: Standalone Worker Entry Point (C3)

**Files:**
- Create: `worker/index.ts`
- Modify: `package.json` (add `worker` script)
- Modify: `tsconfig.json` (ensure worker path resolves)

**Step 1: Create `worker/index.ts`**

```typescript
import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const QUEUE_NAME = "og-fetch";

// Standalone Prisma client (no Next.js Proxy wrapper)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Dynamic import metascraper (ESM modules)
async function createScraper() {
  const metascraper = (await import("metascraper")).default;
  const title = (await import("metascraper-title")).default;
  const description = (await import("metascraper-description")).default;
  const image = (await import("metascraper-image")).default;
  return metascraper([title(), description(), image()]);
}

// SSRF check (duplicated from lib/security.ts to avoid @/ alias dependency)
const PRIVATE_IP_PATTERNS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./,
];
function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname;
    if (hostname === "localhost" || hostname === "[::1]") return false;
    const bare = hostname.replace(/^\[|\]$/g, "");
    if (bare === "0.0.0.0" || bare === "::1" || bare === "::") return false;
    return !PRIVATE_IP_PATTERNS.some((p) => p.test(bare));
  } catch { return false; }
}

async function fetchOgMetadata(url: string) {
  if (!isUrlSafe(url)) {
    return { title: null, description: null, imageUrl: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SharealBot/1.0; +https://shareal.ink)" },
    });
    const html = await response.text();
    const scraper = await createScraper();
    const raw = await scraper({ html, url: response.url });
    return {
      title: raw.title || null,
      description: raw.description || null,
      imageUrl: raw.image || null,
    };
  } catch {
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

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL environment variable is required");
  process.exit(1);
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { ogJobId, url } = job.data as { ogJobId: string; url: string };

    try {
      const metadata = await fetchOgMetadata(url);

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

      await prisma.space.updateMany({
        where: { ogJobId },
        data: {
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
        },
      });

      return metadata;
    } catch (err) {
      await prisma.ogJob.update({
        where: { id: ogJobId },
        data: {
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
          completedAt: new Date(),
        },
      }).catch(() => {});

      throw err;
    }
  },
  {
    connection: { url: redisUrl },
    concurrency: 5,
  }
);

worker.on("failed", (job, err) => {
  console.error(`OG fetch job ${job?.id} failed:`, err.message);
});

worker.on("ready", () => {
  console.log("Worker ready, listening for jobs...");
});

// Graceful shutdown (M7)
function shutdown() {
  console.log("Shutting down worker...");
  worker.close().then(() => {
    pool.end().then(() => process.exit(0));
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`Worker started (queue: ${QUEUE_NAME}, redis: ${redisUrl.replace(/\/\/.*@/, "//***@")})`);
```

**Step 2: Add worker script to `package.json`**

Add to `scripts`:
```json
"worker": "tsx worker/index.ts"
```

**Step 3: Run build**

Run: `bun run build`
Expected: Clean build (worker is not part of Next.js build)

**Step 4: Commit**

```bash
git add worker/index.ts package.json
git commit -m "feat(worker): add standalone worker entry point

Self-contained worker process that can run on Railway independently
of Vercel. Includes SSRF protection, error handling, graceful shutdown."
```

---

## Task 7: Error Boundaries (C5)

**Files:**
- Create: `app/error.tsx`
- Create: `app/global-error.tsx`

**Step 1: Create `app/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#040c1f] px-4 text-center">
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-white/50">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#040c1f] transition-colors hover:bg-white/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
```

**Step 2: Create `app/global-error.tsx`**

```tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#040c1f", fontFamily: "system-ui, sans-serif" }}>
        <main style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100vh", padding: "1rem", textAlign: "center",
        }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "0.75rem", maxWidth: "28rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
            An unexpected error occurred. Please try again.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{
                borderRadius: "0.75rem", backgroundColor: "#fff", padding: "0.625rem 1.5rem",
                fontSize: "0.875rem", fontWeight: 600, color: "#040c1f", border: "none", cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.625rem 1.5rem", fontSize: "0.875rem", fontWeight: 500,
                color: "rgba(255,255,255,0.6)", textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
```

**Step 3: Run build**

Run: `bun run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add app/error.tsx app/global-error.tsx
git commit -m "feat(ux): add error boundaries with branded error state

error.tsx handles route-level errors with reset + home link.
global-error.tsx handles root layout errors with inline styles."
```

---

## Task 8: Security Headers (H2)

**Files:**
- Modify: `next.config.ts`

**Step 1: Add security headers**

Replace `next.config.ts` content:

```typescript
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://plausible.io",
      "frame-src https://open.spotify.com https://www.youtube.com https://www.instagram.com https://www.tiktok.com https://maps.google.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "bullmq",
    "metascraper",
    "metascraper-description",
    "metascraper-image",
    "metascraper-title",
    "@metascraper/helpers",
    "re2",
    "url-regex-safe",
    "@prisma/adapter-pg",
    "pg",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

This also fixes **H3** (open image proxy) by replacing `remotePatterns` with `unoptimized: true`.

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "fix(security): add security headers and close open image proxy

Add CSP, HSTS, X-Frame-Options, nosniff, referrer-policy.
Replace hostname:'**' with images.unoptimized:true (H3)."
```

---

## Task 9: Rate Limiter IP Spoofing Fix (H4)

**Files:**
- Create: `lib/get-client-ip.ts`
- Modify: `app/api/og/route.ts:11`
- Modify: `app/api/spaces/route.ts:7`
- Modify: `app/api/spaces/[token]/respond/route.ts:11`

**Step 1: Create shared helper**

Create `lib/get-client-ip.ts`:

```typescript
import { NextRequest } from "next/server";

/**
 * Extract client IP from request headers.
 * On Vercel, x-real-ip is set by the platform and cannot be spoofed.
 * Falls back to first IP in x-forwarded-for, then "unknown".
 */
export function getClientIp(request: NextRequest): string {
  // Vercel sets x-real-ip — not spoofable
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Fallback: first IP in x-forwarded-for (client IP)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  return "unknown";
}
```

**Step 2: Update all 3 API routes**

In each file, replace `request.headers.get("x-forwarded-for") ?? "unknown"` with:

```typescript
import { getClientIp } from "@/lib/get-client-ip";
// ...
const ip = getClientIp(request);
```

Files to change:
- `app/api/og/route.ts:11` → `const ip = getClientIp(request);`
- `app/api/spaces/route.ts:7` → `const ip = getClientIp(request);`
- `app/api/spaces/[token]/respond/route.ts:11` → `const ip = getClientIp(request);`

**Step 3: Run build**

Run: `bun run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add lib/get-client-ip.ts app/api/og/route.ts app/api/spaces/route.ts app/api/spaces/\[token\]/respond/route.ts
git commit -m "fix(security): use x-real-ip for rate limiting

Extract getClientIp() helper. Use x-real-ip (Vercel, not spoofable)
with fallback to first x-forwarded-for IP."
```

---

## Task 10: Iframe URL Validation in Renderers (H5)

**Files:**
- Modify: `components/surface/renderers/spotify-renderer.tsx:8`
- Modify: `components/surface/renderers/youtube-renderer.tsx:28`
- Modify: `components/surface/renderers/instagram-renderer.tsx:12`
- Modify: `components/surface/renderers/tiktok-renderer.tsx:12`
- Modify: `components/surface/renderers/google-maps-renderer.tsx:14-23`

**Step 1: Add domain validation to each renderer**

Each renderer already constructs embed URLs from known patterns. Add a final domain check before rendering.

**Spotify (`spotify-renderer.tsx`)**: The `getSpotifyEmbedUrl` function already checks `u.hostname !== "open.spotify.com"` for originalUrl. Add a check on the `extras.embedUrl` path:

```typescript
function getSpotifyEmbedUrl(space: RendererProps["space"]): string | null {
  if (space.extras?.embedUrl) {
    try {
      const u = new URL(space.extras.embedUrl);
      if (u.hostname === "open.spotify.com") return space.extras.embedUrl;
    } catch { /* ignore */ }
    return null;
  }
  if (!space.originalUrl) return null;
  try {
    const u = new URL(space.originalUrl);
    if (u.hostname !== "open.spotify.com") return null;
    const m = u.pathname.match(/^\/(track|album|playlist|episode)\/([^/?]+)/);
    if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
  } catch { /* ignore */ }
  return null;
}
```

**YouTube (`youtube-renderer.tsx`)**: embedUrl is constructed from videoId — already safe since it uses `https://www.youtube.com/embed/${videoId}?autoplay=1`. No change needed.

**Instagram (`instagram-renderer.tsx`)**: embedUrl is constructed from shortcode — already safe since it uses `https://www.instagram.com/p/${shortcode}/embed/`. No change needed.

**TikTok (`tiktok-renderer.tsx`)**: embedUrl is constructed from videoId — already safe since it uses `https://www.tiktok.com/embed/v2/${videoId}`. No change needed.

**Google Maps (`google-maps-renderer.tsx`)**: embedUrl is constructed using `https://maps.google.com/maps?q=...` — already safe. No change needed.

Only Spotify needs the fix (the `extras.embedUrl` path bypasses domain validation).

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add components/surface/renderers/spotify-renderer.tsx
git commit -m "fix(security): validate Spotify embed URL domain

Check extras.embedUrl hostname is open.spotify.com before using as
iframe src. Other renderers already construct URLs from safe patterns."
```

---

## Task 11: OG Polling Timeout (H6)

**Files:**
- Modify: `components/create/create-form.tsx:55-77`

**Step 1: Add max poll count**

In `components/create/create-form.tsx`, modify the `pollOgJob` callback:

```typescript
  const pollOgJob = useCallback(
    (id: string) => {
      let pollCount = 0;
      const MAX_POLLS = 20; // ~30 seconds at 1.5s interval

      pollRef.current = setInterval(async () => {
        pollCount++;

        if (pollCount >= MAX_POLLS) {
          // Timed out — let user proceed without OG metadata
          setState("previewing");
          stopPolling();
          return;
        }

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
```

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add components/create/create-form.tsx
git commit -m "fix(ux): add 30-second timeout to OG metadata polling

Stop polling after 20 attempts (~30s). Transition to 'previewing'
state so user can proceed without OG metadata."
```

---

## Task 12: DB Pool Configuration for Serverless (H7)

**Files:**
- Modify: `lib/prisma.ts:13`

**Step 1: Add pool configuration**

In `lib/prisma.ts`, change line 13:

```typescript
    const pool = new pg.Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
```

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add lib/prisma.ts
git commit -m "fix(db): configure pg.Pool for serverless environment

Limit pool to 3 connections, 10s idle timeout, 5s connect timeout.
Prevents connection exhaustion across Vercel cold starts."
```

---

## Task 13: try/catch in API Routes (H8)

**Files:**
- Modify: `app/api/spaces/[token]/route.ts`
- Modify: `app/api/spaces/[token]/respond/route.ts`
- Modify: `app/api/og/[jobId]/route.ts`

**Step 1: Wrap each route in try/catch**

**`app/api/spaces/[token]/route.ts`** — wrap the body of the GET handler:

```typescript
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
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
      extras: (space.extras as Record<string, string>) ?? null,
      createdAt: space.createdAt,
      responseCount: space._count.responses,
    });
  } catch (err) {
    console.error("[spaces/token] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**`app/api/spaces/[token]/respond/route.ts`** — wrap the body of the POST handler in try/catch similarly.

**`app/api/og/[jobId]/route.ts`** — wrap the body of the GET handler in try/catch similarly.

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/api/spaces/\[token\]/route.ts app/api/spaces/\[token\]/respond/route.ts app/api/og/\[jobId\]/route.ts
git commit -m "fix(api): add try/catch error handling to 3 API routes

Wrap spaces/[token] GET, spaces/[token]/respond POST, og/[jobId] GET
in try/catch returning structured 500 errors instead of raw exceptions."
```

---

## Task 14: Deduplicate DB Query on Surface Page (H9)

**Files:**
- Modify: `app/[token]/page.tsx:20,48`

**Step 1: Add React.cache wrapper**

In `app/[token]/page.tsx`, add a cached query function and use it in both `generateMetadata` and the page component:

```typescript
// Add import at top:
import { cache } from "react";

// Add cached query function (after imports, before PageProps):
const getSpace = cache(async (token: string) => {
  return prisma.space.findUnique({
    where: { token },
    include: { _count: { select: { responses: { where: { responseType: "yes" } } } } },
  });
});
```

Then replace both `prisma.space.findUnique` calls:

- In `generateMetadata` (line 20): `const space = await getSpace(token);`
- In `SurfacePage` (line 48): `const space = await getSpace(token);`

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/\[token\]/page.tsx
git commit -m "fix(perf): deduplicate Prisma query on surface page

Use React.cache() to memoize space lookup. generateMetadata and page
component now share one DB round-trip per request instead of two."
```

---

## Task 15: Database Indexes (H10)

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add indexes**

In `prisma/schema.prisma`:

Add `@@index([ogJobId])` inside the `Space` model (before `@@map`):

```prisma
  @@index([ogJobId])
  @@map("spaces")
```

Add `@@index([status, createdAt])` inside the `OgJob` model (before `@@map`):

```prisma
  @@index([status, createdAt])
  @@map("og_jobs")
```

**Step 2: Generate Prisma client**

Run: `bunx prisma generate`
Expected: Success

**Step 3: Run build**

Run: `bun run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "fix(db): add missing indexes on Space.ogJobId and OgJob(status,createdAt)

Index on ogJobId speeds up worker's updateMany.
Composite index on (status, createdAt) enables efficient cleanup queries."
```

Note: Run `bunx prisma migrate dev --name add-indexes` before deploying to create the migration.

---

## Task 16: Health Check Endpoint (M2)

**Files:**
- Create: `app/api/health/route.ts`

**Step 1: Create health check**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[health] DB check failed:", err);
    return NextResponse.json(
      { status: "error", error: "Database unreachable" },
      { status: 503 }
    );
  }
}
```

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/api/health/route.ts
git commit -m "feat(ops): add /api/health endpoint

Returns 200 with DB connectivity check. Returns 503 if DB unreachable."
```

---

## Task 17: InMemoryRateLimiter Prod Warning + Cleanup (M4, M6)

**Files:**
- Modify: `lib/adapters/in-memory-rate-limiter.ts`
- Modify: `lib/container.ts:15-17`

**Step 1: Add cleanup and prod warning**

In `lib/adapters/in-memory-rate-limiter.ts`, add periodic cleanup:

```typescript
import type { IRateLimiter, RateLimitResult } from "@/lib/interfaces";

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export class InMemoryRateLimiter implements IRateLimiter {
  private store = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(config?: RateLimiterConfig) {
    this.maxRequests = config?.maxRequests ?? parseInt(process.env.RATE_LIMIT_MAX ?? "20", 10);
    this.windowMs = config?.windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);

    // Periodic cleanup to prevent memory leak (M6)
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs * 2);
    // Don't prevent Node from exiting
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.store) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, valid);
      }
    }
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const timestamps = (this.store.get(key) ?? []).filter((t) => now - t < this.windowMs);

    if (timestamps.length >= this.maxRequests) {
      const resetAt = timestamps[0] + this.windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    timestamps.push(now);
    this.store.set(key, timestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - timestamps.length,
      resetAt: now + this.windowMs,
    };
  }
}
```

In `lib/container.ts`, add a prod warning:

```typescript
export const rateLimiter: IRateLimiter = process.env.UPSTASH_REDIS_REST_URL
  ? new UpstashRateLimiter()
  : (() => {
      if (process.env.NODE_ENV === "production") {
        console.warn("[container] UPSTASH_REDIS_REST_URL not set — using in-memory rate limiter (not shared across instances)");
      }
      return new InMemoryRateLimiter();
    })();
```

**Step 2: Run tests**

Run: `bun run test`
Expected: All pass

**Step 3: Commit**

```bash
git add lib/adapters/in-memory-rate-limiter.ts lib/container.ts
git commit -m "fix(rate-limit): add cleanup interval and prod warning

Periodically purge expired entries to prevent memory leak (M6).
Log warning in production when falling back to in-memory limiter (M4)."
```

---

## Task 18: Redis Failure Resilience (M8)

**Files:**
- Modify: `app/api/og/route.ts:55`

**Step 1: Wrap queue.enqueue in try/catch**

In `app/api/og/route.ts`, replace lines 55-56:

```typescript
    try {
      await queue.enqueue("og-fetch", { ogJobId: ogJob.id, url: parsed.value });
    } catch (enqueueErr) {
      console.error("[og-route] Failed to enqueue job (Redis may be down):", enqueueErr);
      // Space will be created without OG metadata — not a fatal error
    }
```

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/api/og/route.ts
git commit -m "fix(resilience): gracefully handle Redis failures in OG route

If queue.enqueue fails, log error and continue. OG job exists in DB
but won't be processed. Space creation can still proceed."
```

---

## Task 19: Plausible Error Logging in Dev (M10)

**Files:**
- Modify: `lib/adapters/plausible-analytics.ts:22`

**Step 1: Add dev-mode error logging**

Replace `.catch(() => {})` with:

```typescript
    }).catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[plausible]", err instanceof Error ? err.message : err);
      }
    });
```

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add lib/adapters/plausible-analytics.ts
git commit -m "fix(analytics): log Plausible errors in development

Surface analytics failures during development instead of silently
swallowing them."
```

---

## Task 20: Final Verification

**Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests pass

**Step 2: Run production build**

Run: `bun run build`
Expected: Clean build with no errors

**Step 3: Verify no security regressions**

Manually check:
- `lib/security.ts` exports `isUrlSafe` and `sanitizeHref`
- `metascraper-og-fetcher.ts` calls `isUrlSafe` before fetch
- `app/api/spaces/route.ts` validates URL protocol, enum values, and string lengths
- All renderer components use `sanitizeHref` for user-supplied URLs
- All API routes use `getClientIp` instead of raw `x-forwarded-for`
- `next.config.ts` has security headers and `images.unoptimized: true`
- Error boundaries exist at `app/error.tsx` and `app/global-error.tsx`
- `/api/health` endpoint exists

---

## Summary of Fixes by Audit Finding

| Finding | Task | Status |
|---------|------|--------|
| C1: SSRF in OG Fetcher | Task 1 | `isUrlSafe()` guard |
| C2: Worker in Serverless | Task 5 | Removed `getWorker()` from route |
| C3: Worker Entrypoint | Task 6 | `worker/index.ts` standalone |
| C4: Worker Fetch Failures | Task 4 | try/catch + status update |
| C5: No Error Boundary | Task 7 | `error.tsx` + `global-error.tsx` |
| C6: javascript: XSS | Task 2 | `sanitizeHref()` + protocol validation |
| H1: Input Validation | Task 3 | Enum + length checks |
| H2: Security Headers | Task 8 | CSP, HSTS, X-Frame-Options |
| H3: Open Image Proxy | Task 8 | `unoptimized: true` |
| H4: IP Spoofing | Task 9 | `getClientIp()` with x-real-ip |
| H5: Iframe Validation | Task 10 | Spotify embedUrl domain check |
| H6: Polling Timeout | Task 11 | MAX_POLLS = 20 |
| H7: DB Pool Config | Task 12 | max:3, timeouts |
| H8: Missing try/catch | Task 13 | 3 routes wrapped |
| H9: Duplicate DB Query | Task 14 | `React.cache()` |
| H10: Missing Indexes | Task 15 | 2 indexes added |
| M2: Health Check | Task 16 | `/api/health` |
| M4: Silent Fallback | Task 17 | Prod console.warn |
| M6: Memory Leak | Task 17 | Cleanup interval |
| M7: Graceful Shutdown | Task 6 | SIGTERM handler in worker |
| M8: Redis Failure | Task 18 | try/catch on enqueue |
| M10: Plausible Errors | Task 19 | Dev-mode logging |

---

## Task 21: Fix ESLint Config — Exclude `.claude/**` (CR-7)

**Files:**
- Modify: `eslint.config.mjs:9-15`

**Step 1: Add `.claude/**` to global ignores**

In `eslint.config.mjs`, add `.claude/**` and `node_modules/**` to the `globalIgnores` array:

```javascript
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    "node_modules/**",
  ]),
```

**Step 2: Verify lint now works on first-party code**

Run: `bunx eslint app components lib --quiet`
Expected: Only 4 first-party errors (not 5833 from worktrees)

**Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "fix(lint): exclude .claude/** from ESLint scope

Prevents worktree and generated files from flooding lint output."
```

---

## Task 22: Fix First-Party ESLint Errors (CR-8)

**Files:**
- Modify: `components/create/create-form.tsx:51` (set-state-in-effect)
- Modify: `components/ui/copy-toast.tsx:12` (set-state-in-effect)
- Modify: `components/create/link-preview.tsx:18` (static-components)
- Modify: `components/surface/surface-card.tsx:22` (static-components)

**Step 1: Fix each error**

For `create-form.tsx:51` — the effect calls `setIntentType` based on derived state. Replace the effect with a computed value or adjust the pattern to satisfy the lint rule.

For `copy-toast.tsx:12` — review the effect that sets state and determine if the state can be derived instead.

For `link-preview.tsx:18` and `surface-card.tsx:22` — these are `static-components` warnings. Move dynamic component selection outside the render function or memoize the component lookup.

**Step 2: Run lint**

Run: `bunx eslint app components lib --quiet`
Expected: 0 errors

**Step 3: Run tests**

Run: `bun run test`
Expected: All pass

**Step 4: Commit**

```bash
git add components/create/create-form.tsx components/ui/copy-toast.tsx \
  components/create/link-preview.tsx components/surface/surface-card.tsx
git commit -m "fix(lint): resolve 4 first-party ESLint errors

Fix set-state-in-effect and static-components warnings."
```

---

## Task 23: Fix Stale E2E Test (CR-9)

**Files:**
- Modify: `e2e/core-flows.spec.ts:31`

**Step 1: Update assertion**

The test expects `text=not found` but the actual page says "This link doesn't exist". Update:

```typescript
  test("shows not-found for invalid token", async ({ page }) => {
    await page.goto("/zzzzzzznotreal");
    await expect(page.getByRole("heading", { name: /doesn.t exist/i })).toBeVisible({ timeout: 5000 });
  });
```

**Step 2: Run E2E tests**

Run: `bun run test:e2e`
Expected: 18/18 pass

**Step 3: Commit**

```bash
git add e2e/core-flows.spec.ts
git commit -m "fix(e2e): update 404 assertion to match actual page copy

Use heading role matcher instead of brittle text literal."
```

---

## Task 24: Add Composite Index on Response (CR-5)

**Files:**
- Modify: `prisma/schema.prisma` — Response model

**Step 1: Replace existing index with composite**

In `prisma/schema.prisma`, replace `@@index([spaceId])` in the Response model with:

```prisma
  @@index([spaceId, responseType])
  @@map("responses")
```

This covers both the existing `spaceId` lookup and the filtered count queries in `respond/route.ts:32`.

**Step 2: Generate Prisma client**

Run: `bunx prisma generate`
Expected: Success

**Step 3: Run build**

Run: `bun run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "fix(db): upgrade Response index to composite (spaceId, responseType)

Covers filtered count queries for vote tallying. Replaces single-column
spaceId index."
```

Note: Run `bunx prisma migrate dev --name composite-response-index` before deploying.

---

## Task 25: Dependency Audit Fix (CR-4)

**Step 1: Run audit and identify upgradeable deps**

Run: `bun audit`
Review output for actionable upgrades.

**Step 2: Update vulnerable dependencies**

Run: `bun update minimatch lodash hono`
Or add overrides in `package.json` for transitive deps:

```json
"overrides": {
  "minimatch": ">=10.2.1"
}
```

**Step 3: Re-run audit**

Run: `bun audit`
Expected: No high-severity vulnerabilities

**Step 4: Run tests**

Run: `bun run test && bun run build`
Expected: All pass, clean build

**Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "fix(deps): resolve high and moderate dependency vulnerabilities

Upgrade minimatch, lodash, hono to patched versions."
```

---

## Task 26: Prevent Concurrent Polling + Re-submit While Fetching (CR-6)

**Files:**
- Modify: `components/create/create-form.tsx:57,182`

**Step 1: Add stopPolling() before creating new interval**

In `create-form.tsx`, in the `pollOgJob` callback, call `stopPolling()` before setting the new interval:

```typescript
  const pollOgJob = useCallback(
    (id: string) => {
      stopPolling(); // Clear any existing interval first
      let pollCount = 0;
      const MAX_POLLS = 20;
      // ... rest of Task 11 implementation
```

**Step 2: Prevent re-submit while fetching**

In `handleKeyDown`, line 182, the condition allows submit during "fetching" state. Change:

```typescript
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (state === "idle") {
        handleSubmitInput();
      } else if (state === "previewing") {
        handleCreate();
      }
    }
  };
```

Remove `|| state === "fetching"` from the first condition.

**Step 3: Run build**

Run: `bun run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add components/create/create-form.tsx
git commit -m "fix(ux): prevent concurrent polling and re-submit while fetching

Clear existing interval before starting new one.
Disable Enter-key submit while already in 'fetching' state."
```

---

## Final Verification (Updated)

**Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests pass

**Step 2: Run lint**

Run: `bunx eslint app components lib --quiet`
Expected: 0 errors

**Step 3: Run production build**

Run: `bun run build`
Expected: Clean build

**Step 4: Run E2E (if server available)**

Run: `bun run test:e2e`
Expected: All pass

---

## Summary of Fixes by Source

### From Production Audit (docs/plans/2026-02-22-production-audit-design.md)

| Finding | Task | Status |
|---------|------|--------|
| C1: SSRF in OG Fetcher | Task 1 | `isUrlSafe()` guard |
| C2: Worker in Serverless | Task 5 | Removed `getWorker()` from route |
| C3: Worker Entrypoint | Task 6 | `worker/index.ts` standalone |
| C4: Worker Fetch Failures | Task 4 | try/catch + status update |
| C5: No Error Boundary | Task 7 | `error.tsx` + `global-error.tsx` |
| C6: javascript: XSS | Task 2 | `sanitizeHref()` + protocol validation |
| H1: Input Validation | Task 3 | Enum + length checks |
| H2: Security Headers | Task 8 | CSP, HSTS, X-Frame-Options |
| H3: Open Image Proxy | Task 8 | `unoptimized: true` |
| H4: IP Spoofing | Task 9 | `getClientIp()` with x-real-ip |
| H5: Iframe Validation | Task 10 | Spotify embedUrl domain check |
| H6: Polling Timeout | Task 11 | MAX_POLLS = 20 |
| H7: DB Pool Config | Task 12 | max:3, timeouts |
| H8: Missing try/catch | Task 13 | 3 routes wrapped |
| H9: Duplicate DB Query | Task 14 | `React.cache()` |
| H10: Missing Indexes | Task 15 | 2 indexes added |
| M2: Health Check | Task 16 | `/api/health` |
| M4: Silent Fallback | Task 17 | Prod console.warn |
| M6: Memory Leak | Task 17 | Cleanup interval |
| M7: Graceful Shutdown | Task 6 | SIGTERM handler in worker |
| M8: Redis Failure | Task 18 | try/catch on enqueue |
| M10: Plausible Errors | Task 19 | Dev-mode logging |

### From Code Review (docs/code-review-2026-02-22.md)

| Finding | Task | Status |
|---------|------|--------|
| CR-4: Dependency Vulnerabilities | Task 25 | bun audit + upgrade |
| CR-5: Vote Count Index | Task 24 | Composite `(spaceId, responseType)` |
| CR-6: Concurrent Polling | Task 26 | stopPolling() before new interval |
| CR-7: ESLint Config | Task 21 | Exclude `.claude/**` |
| CR-8: ESLint Errors | Task 22 | Fix 4 first-party errors |
| CR-9: Stale E2E Test | Task 23 | Update 404 assertion |

(CR-1, CR-2, CR-3 were already covered by audit findings C1, H4, H1/C6.)

### Not addressed in this plan (post-deploy):
- M1: Sentry integration (requires account setup)
- M3: OgJob cleanup cron (requires Vercel cron config)
- M5: CSRF protection (low risk for MVP, no auth)
- M9: Server-side vote dedup (post-MVP)
- L1-L10: Low-priority improvements
