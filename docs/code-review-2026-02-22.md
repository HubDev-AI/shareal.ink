# Code Review Report (Security + Code Quality)

Date: 2026-02-22
Repository: `shareal.ink`
Reviewer: Codex

## Scope and Method

Reviewed the full first-party codebase (`app`, `components`, `lib`, `prisma`, configs) with focus on security and production quality.

Executed checks:
- `bun run test` -> 62/62 tests passed.
- `bun run build` -> production build passed.
- `bun run lint` -> failed with large noise from non-project directories.
- `bunx eslint app components lib` -> failed with 4 first-party errors.
- `bun audit` -> 7 vulnerabilities (1 high, 5 moderate, 1 low).
- `bun run test:e2e` -> 17 passed, 1 failed.

## Findings (Ordered by Severity)

### 1) P1 - SSRF in OG Fetch Pipeline

**Evidence**
- Untrusted URL is accepted and enqueued: `app/api/og/route.ts:47`, `app/api/og/route.ts:55`.
- Worker fetches URL directly server-side: `lib/adapters/metascraper-og-fetcher.ts:20`.
- Redirect destination is trusted without policy checks: `lib/adapters/metascraper-og-fetcher.ts:27`.
- Job metadata is exposed through API polling: `app/api/og/[jobId]/route.ts:15`.

**Impact**
- Enables server-side request forgery to internal/private addresses (for example cloud metadata endpoints, RFC1918 ranges, localhost).
- Allows internal network probing and possible sensitive data exposure via parsed metadata fields.

**Recommendation**
- Enforce outbound URL policy before enqueue/fetch: allow only `http/https`, resolve DNS, block private/reserved IP ranges, re-validate after redirects.
- Limit redirects and response size.
- Prefer an egress-restricted fetch service or proxy.

### 2) P2 - Rate Limiting Can Be Bypassed via Client-Controlled Header

**Evidence**
- Rate-limit keys are based on `x-forwarded-for` directly:
  - `app/api/og/route.ts:11`
  - `app/api/spaces/route.ts:7`
  - `app/api/spaces/[token]/respond/route.ts:11`

**Impact**
- Attackers can rotate/spoof header values to bypass limits and amplify abuse (especially for OG queueing).

**Recommendation**
- Derive client IP from trusted platform metadata/proxy chain only (canonical first hop from trusted edge).
- Add secondary throttling keys (token/user/fingerprint) to reduce spoofing impact.

### 3) P2 - Missing Server-Side Input Validation in `POST /api/spaces` (Including URL Scheme Safety)

**Evidence**
- Payload is trusted with minimal checks: `app/api/spaces/route.ts:21`, `app/api/spaces/route.ts:23`.
- Raw `url` is stored directly: `app/api/spaces/route.ts:51`.
- Stored `originalUrl` is rendered into anchors in multiple places:
  - `components/surface/shared/secondary-actions.tsx:33`
  - `components/surface/shared/hero-image.tsx:24`
  - `components/surface/shared/truncated-text.tsx:30`
- URL protocol validation exists in `parseInput` (`lib/validation.ts:17`) but is not applied in `/api/spaces`.

**Impact**
- Invalid enum/fuzzed payloads can trigger Prisma 500s instead of safe 400s.
- Non-http schemes can be persisted and later rendered as clickable links.

**Recommendation**
- Add schema validation in `/api/spaces` (Zod or equivalent) for enums, string lengths, and optional fields.
- Normalize and enforce `http/https` on server for `url`.
- Reject unsafe schemes and malformed URLs with explicit 4xx responses.

### 4) P2 - Dependency Vulnerabilities Present

**Evidence**
- `bun audit` reports:
  - `minimatch <10.2.1` (high, ReDoS)
  - `lodash <=4.17.22` (moderate, prototype pollution)
  - `hono <4.11.7` (multiple moderate advisories)

**Impact**
- Increases supply-chain risk surface and may become exploitable depending on dependency execution paths.

**Recommendation**
- Upgrade transitive dependencies (`bun update` / selective overrides) and re-run `bun audit`.
- Add CI policy to fail on high severity advisories.

### 5) P2 - Vote Counting Query Pattern Will Degrade at Scale

**Evidence**
- Two filtered count queries on every vote: `app/api/spaces/[token]/respond/route.ts:32`.
- Only single-column index exists: `prisma/schema.prisma:71`.

**Impact**
- As response volume grows, per-request count latency increases due to non-covering index scans.

**Recommendation**
- Add composite index `@@index([spaceId, responseType])`.
- Consider denormalized counters on `Space` updated transactionally for O(1) reads.

### 6) P2 - OG Polling/Failure Handling Can Leave UI Stuck and Leak Polling Work

**Evidence**
- Polling interval is created without first clearing any existing interval: `components/create/create-form.tsx:57`.
- Enter key allows repeated submit while already fetching: `components/create/create-form.tsx:182`.
- Worker failure hook logs only and does not mark job failed in DB: `lib/worker.ts:55`.

**Impact**
- Multiple intervals can run concurrently.
- Jobs can remain in `processing` state and frontend may poll indefinitely.

**Recommendation**
- Always call `stopPolling()` before creating a new interval.
- Disable re-submit while fetching.
- On worker failures, write terminal job state (`failed`) and error details.
- Add client-side polling timeout/backoff and terminal fallback.

### 7) P2 - Lint Configuration Includes Non-Project Trees, Breaking Signal

**Evidence**
- ESLint global ignores do not exclude `.claude/**`: `eslint.config.mjs:9`.
- `bun run lint` produced 5833 findings, mostly from `.claude/worktrees/...` and nested generated outputs.

**Impact**
- Lint output becomes noisy/unactionable and can hide real issues.

**Recommendation**
- Add ignores for `.claude/**` and nested build artifacts (`**/.next/**`) in ESLint config.
- Keep lint scope aligned to first-party source in CI.

### 8) P2 - First-Party ESLint Errors in Active Source

**Evidence**
- `react-hooks/set-state-in-effect`:
  - `components/create/create-form.tsx:51`
  - `components/ui/copy-toast.tsx:12`
- `react-hooks/static-components`:
  - `components/create/link-preview.tsx:18`
  - `components/surface/surface-card.tsx:22`

**Impact**
- Current lint gate fails on own source.
- Potential render churn/state-reset behavior in component rendering paths.

**Recommendation**
- Replace effect-driven derived state with computed values where possible.
- Refactor renderer selection pattern to avoid dynamic component creation warning path.
- Re-run lint with CI gate.

### 9) P3 - One E2E Test Is Stale and Fails

**Evidence**
- Failing assertion expects text `not found`: `e2e/core-flows.spec.ts:31`.
- Actual page copy is `This link doesn't exist`: `app/not-found.tsx:9`.
- `bun run test:e2e` result: 17 passed, 1 failed.

**Impact**
- E2E suite is not green; if required in CI this blocks merges.

**Recommendation**
- Update test to assert stable UX contract (for example heading role/test id) instead of brittle literal.

## Summary

- Total findings: 9
- P1: 1
- P2: 7
- P3: 1

Top priority is fixing SSRF protections in the OG fetch workflow before further exposure.
