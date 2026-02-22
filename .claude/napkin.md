# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-02-21 | Build | Prisma 7 removed `url` from schema.prisma | Use `prisma.config.ts` with `defineConfig({ datasource: { url: env("DATABASE_URL") } })` |
| 2026-02-21 | Build | `new PrismaClient()` fails at build time (no DB connection) | Use Proxy-based lazy init to defer instantiation to runtime |
| 2026-02-21 | Build | ioredis type conflict with BullMQ (bundles its own) | Don't install standalone ioredis; use `{ connection: { url: getRedisUrl() } }` |
| 2026-02-21 | Build | metascraper's re2 native module breaks Turbopack | Add re2, @metascraper/helpers, url-regex-safe to `serverExternalPackages` |
| 2026-02-21 | Build | motion.button + React ButtonHTMLAttributes causes onDrag type conflict | Use plain `<button>` with CSS `active:scale-[0.97]` instead of motion.button |
| 2026-02-21 | Build | `getWorker()` at module level triggers Redis connect during build | Move worker init inside request handler |
| 2026-02-21 | Types | TypeScript narrows state inside conditional render, blocks comparison | Include all possible states in the guard condition |
| 2026-02-21 | React | CopyToast sessionStorage effect not working — two components racing for same flag | Only one component should consume a sessionStorage flag; remove the consumer from the other |
| 2026-02-21 | React | sessionStorage effect broken in React 18 strict mode — first effect removes flag, second doesn't find it | Defer `sessionStorage.removeItem` to the dismiss timer callback, not the effect body |
| 2026-02-21 | CSS | Orbiting icons clipped by `overflow: hidden` on `.bg-aurora` | Position badge far enough from edge to keep orbit radius within bounds |
| 2026-02-22 | Prisma | `prisma migrate diff --to-schema-datamodel` flag removed in Prisma 7 | Use `--to-schema` instead |
| 2026-02-22 | Prisma | ALTER COLUMN to narrower VARCHAR fails if existing data exceeds new length | Add `UPDATE SET col = LEFT(col, N)` before the ALTER |
| 2026-02-22 | Turbopack | Stale Prisma client cache causes "Invalid value for argument" on valid enum values | `rm -rf .next/dev` + restart dev server after `prisma generate` |
| 2026-02-22 | CSS | Focus ring clipped by `overflow-hidden` on CSS Grid collapse wrapper | Add `px-1 -mx-1` to overflow container for ring breathing room |
| 2026-02-22 | Git | `git push` to protected branch fails — dev requires PRs | Always create feature branch, PR, then merge |
| 2026-02-22 | UI | Pixel-art logo in QR code looks terrible at small sizes | Use actual PNG image with white circle background instead |
| 2026-02-22 | UI | Homepage preview iframes (Google Maps) look broken/heavy | Use OG thumbnail images for all homepage previews, save iframes for surface pages |
| 2026-02-22 | Self | Forgot to quote bracketed App Router paths in zsh (`[token]`) while reading files | Quote paths like `'app/api/spaces/[token]/route.ts'` or escape brackets |
| 2026-02-22 | Self | Extracted worker to standalone `worker/index.ts` with inline OG scraping, losing site-specific extractors (coords, videoId, embedUrl) and extras DB writes | When extracting code to standalone process, reuse existing adapters (`MetascraperOgFetcher`) via `@/` imports — bun resolves tsconfig paths. Never inline a simplified copy of adapter logic. |
| 2026-02-22 | Self | CSP `frame-src` allowed `maps.google.com` but Google Maps embed redirects to `www.google.com` | Always add both the direct domain AND redirect target to CSP frame-src. Test embeds in browser after CSP changes. |

## User Preferences
- Building shareal.ink MVP - "One link = One beautiful surface"
- Premium, calm aesthetic - off-white (#FAFAF8), single accent color, soft shadows
- Minimal UI, no dashboards, single column max 720px
- Adapter architecture for everything - easy swap-in of auth, analytics, etc.
- Package manager: bun throughout
- No approving reviews on PRs, just require PR (no direct push to main/dev)
- dev is default branch, main is production

## Patterns That Work
- CSS Grid `grid-template-rows: 0fr/1fr` for smooth height-to-auto collapse — no reflow jump (better than Motion `height: "auto"`)
- Animate height to 0 (not AnimatePresence remove) for smooth layout collapse — avoids content jumping
- Client wrapper component (HomeContent) to bridge server page + client state across sibling components
- rembg via pipx (PEP 668 blocks pip install) + sharp (from Next.js deps) for image processing in CLI
- Manual ICO generation (header + dir entries + PNG buffers) when npm packages are flaky
- Adapter/interface pattern with container.ts central wiring
- Noop adapters for future features (auth, analytics) - call them now, swap later
- Non-blocking OG fetch with BullMQ queue + frontend polling
- Proxy-based lazy init for PrismaClient (avoids build-time instantiation)
- CSS active:scale instead of motion.button for simple tap feedback
- serverExternalPackages for native modules in Next.js
- Renderer registry pattern for link-type-specific components (getRenderer → ComponentType<RendererProps>)
- Structured `extras` JSON for site-specific metadata (coords, videoId, embedUrl, tweetId)
- Keyless Google Maps embed: `maps.google.com/maps?q=...&output=embed`
- Thumbnail-first → click-to-embed pattern for all video/media renderers (YouTube, TikTok, Instagram) — avoids showing embed errors on page load
- Instagram public embed: `instagram.com/p/{shortcode}/embed/` — no API key needed
- Flush media rounding `rounded-t-2xl` standardized across all renderers (previously TikTok used inset `m-3 mb-0 rounded-2xl`)
- AnimatePresence + motion.div for smooth toast enter/exit (slide + fade) — replaces conditional render pop-in
- Homepage previews: lightweight static images only (OG thumbnails), full interactive embeds on surface pages
- TruncatedText component: useRef overflow detection + line-clamp-2 + show more/less toggle for long titles
- QR code logo: actual PNG with white circle + errorCorrectionLevel "H" (30% recovery) — pixel art doesn't work at this scale
- `px-1 -mx-1` trick: gives overflow-hidden containers room for focus rings without affecting layout
- For repo linting in this workspace, ignore nested tool/worktree folders (`.claude/**`) in ESLint config or lint output will be dominated by unrelated files
- For quick signal, run `bunx eslint app components lib` to isolate first-party lint errors from workspace noise
- Standalone worker (`worker/index.ts`) can use `@/` imports — bun resolves tsconfig paths, no need to duplicate adapter code

## Patterns That Don't Work
- Next.js App Router: `app/favicon.ico` takes precedence over `public/favicon.ico` — must replace the one in `app/`
- AnimatePresence mount/unmount for collapsing elements — causes layout jump; use CSS Grid rows instead
- Motion `height: "auto"` — causes reflow jump at end of animation; use CSS Grid `grid-template-rows: 0fr/1fr` instead
- png-to-ico npm package — broken API, manual ICO buffer creation is more reliable
- motion.button with spread React HTML props (type conflicts)
- Module-level side effects in API routes (runs during build)
- Standalone ioredis with BullMQ (type conflicts)
- Prisma 7 datasource url in schema.prisma (must use prisma.config.ts)
- Prisma nullable Json fields don't accept `null` — use `undefined` to skip or `Prisma.JsonNull`
- `prisma migrate dev` doesn't work non-interactively — use `migrate diff` + manual migration + `migrate deploy`
- Manual ALTER TYPE on enum before Prisma migration causes drift — reset DB or create migration manually
- Direct TikTok iframe embed on page load — shows "Video unavailable" error immediately; use thumbnail-first pattern instead
- TikTok OG scraping often returns no image (JS-rendered meta tags) — always have a no-thumbnail fallback
- Pixel-art in QR center — too crude at QR module scale, use actual image instead
- Iframe embeds in homepage preview cards — too heavy, shows errors; use OG images
- Inlining simplified copies of adapter logic in standalone processes — loses site extractors, extras, and diverges from the app. Always import the real adapter.

## Domain Notes
- Repo: https://github.com/HubDev-AI/shareal.ink
- Branches: main (production), dev (default, for PRs)
- Both branches protected: no direct push, no force push, no deletion, PRs only (0 approvals needed)
- Hosting plan: Vercel (app) + Railway (PostgreSQL) + Upstash (Redis)
- Domain shareal.ink is owned and ready
- MVP complete: all 12 tasks done, 25 tests passing, build clean
- Link-type renderers: 22-task plan implemented, 35 tests, build clean (PR #9)
- Intent + polish + intent system: 25-task plan across 3 branches, 46 tests, PRs #11 #12 #13
  - Branch 1: intentText field end-to-end (DB → API → create form → surface)
  - Branch 2: UI polish (glass input, button hierarchy, timestamp, aurora gradient calm center)
  - Branch 3: intentType selector (meet/vote/share), vote UI, adaptive backgrounds
- Vitest picks up files in `.claude/worktrees/` — added exclude in vitest.config.ts
- Nyra integration: brand mascot (blue fox), PR #15 — hero on homepage, seal watermark on surfaces, favicon
  - Assets in public/nyra/ (hero 512px, icon 128px, favicon 16/32/64px, apple-icon 180px)
  - NyraHero: breathing animation, smooth collapse on preview via HomeContent wrapper
  - NyraSeal: 15% opacity watermark bottom-right on surface pages
- Copy-to-clipboard: PR #18 — auto-copy on creation + toast + manual copy button on surface pages
  - sessionStorage "link-copied" flag bridges create-form → surface page
  - CopyToast sole consumer of flag; CopyButton is manual-only
  - "Apps are coming" badge with orbiting Apple/Android icons (CSS orbit keyframe)
- Embed improvements: PRs #19 #20 — TikTok thumbnail-first + Instagram interactive embed + inset padding
- E2E tests: Playwright 1.58.2, chromium only, 3 spec files (core-flows, link-types, error-cases)
  - `bun run test:e2e` to run; requires running dev server + database
  - playwright.config.ts uses webServer directive to auto-start `bun run dev`
- Config/README polish: PR #23 — .env.example restructured, README rewritten, CLAUDE.md updated
- Card constraints: PR #23 — max-h-64 images, TruncatedText, line-clamp-3 descriptions, Nyra QR overlay
- OG route error handling: PR #23 — try/catch so bad links return error message, not 500
- Toast animation: PR #23 — AnimatePresence slide+fade enter/exit
- Maps preview fix: PR #24 — OG image instead of iframe on homepage
- Deploy guide: PR #25 — docs/DEPLOY.md with Vercel + Railway + Upstash steps
- UI polish: PR #27 — focus ring fix, card width max-w-lg, QR overlay
- QR Nyra image: PR #28 — actual nyra-icon.png replaces pixel art
- Surface card width: `sm:max-w-lg` (512px) matches homepage form width
- Next up: auth, expiration, admin dashboard, image upload
- TODO: Add E2E tests for all link types (Maps, YouTube, Spotify, etc.) — worker extraction + CSP bugs should have been caught by tests
- Docker Compose: postgres, redis, app, worker — all working locally. PRs #33 #34 #35
