# Intent Layer + UI Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add creator intent text to surfaces ("Friday 7PM?") and polish the UI (input, buttons, spacing, timestamp, gradient).

**Architecture:** Two branches shipped sequentially. Branch 1 (`feat/intent-layer`) adds the `intentText` field end-to-end: DB → API → create form → surface display. Branch 2 (`feat/ui-polish`) is pure CSS/styling: input glass feel, button hierarchy, card spacing, relative timestamp, gradient softening. Branch 2 is independently revertable.

**Tech Stack:** Next.js 16 App Router, Prisma 7, TypeScript, Tailwind CSS 4, Motion

---

# BRANCH 1: feat/intent-layer

Create branch from dev before starting:

```bash
git checkout dev && git pull origin dev
git checkout -b feat/intent-layer
```

---

### Task 1: DB Migration — Add `intentText` Column

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add intentText to Space model**

In `prisma/schema.prisma`, add after the `primaryActionLabel` field:

```prisma
intentText         String?     @map("intent_text")
```

**Step 2: Create and apply migration**

Run: `bunx prisma migrate dev --name add-intent-text`

If this fails (it sometimes does non-interactively), create the migration manually:

```bash
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_intent_text
```

Write the SQL:
```sql
ALTER TABLE "spaces" ADD COLUMN "intent_text" TEXT;
```

Then run: `bunx prisma migrate deploy`

**Step 3: Regenerate Prisma client**

Run: `bunx prisma generate`

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add intentText column to Space model"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `lib/types.ts`

**Step 1: Add intentText to SpaceData**

In `lib/types.ts`, add `intentText` to the `SpaceData` interface after `primaryActionLabel`:

```ts
intentText: string | null;
```

Also add it to `SpaceCreateInput`:

```ts
intentText: string | null;
```

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add intentText to SpaceData and SpaceCreateInput types"
```

---

### Task 3: Update API — Create Space with intentText

**Files:**
- Modify: `app/api/spaces/route.ts`

**Step 1: Accept intentText in POST body**

In the POST handler, destructure `intentText` from the request body:

```ts
const { url, jobId, title, description, linkType, primaryActionLabel, intentText } = body;
```

Include it in `prisma.space.create`:

```ts
intentText: intentText || null,
```

**Step 2: Commit**

```bash
git add app/api/spaces/route.ts
git commit -m "feat: accept intentText in POST /api/spaces"
```

---

### Task 4: Update SSR Page — Pass intentText to SpaceData

**Files:**
- Modify: `app/[token]/page.tsx`

**Step 1: Add intentText to the spaceData object**

In the `SurfacePage` component, add to the `spaceData` construction:

```ts
intentText: space.intentText,
```

**Step 2: Commit**

```bash
git add app/\[token\]/page.tsx
git commit -m "feat: pass intentText through SSR page to SpaceData"
```

---

### Task 5: Intent Placeholder Config

**Files:**
- Modify: `lib/config/link-types.ts`

**Step 1: Add intentPlaceholder to LinkTypeConfig**

Add a new field to the `LinkTypeConfig` interface:

```ts
/** Placeholder text for the intent input on create form */
intentPlaceholder: string;
```

Add values to each link type:

```ts
google_maps: { ..., intentPlaceholder: "Friday 7PM?" },
youtube:     { ..., intentPlaceholder: "Worth watching?" },
instagram:   { ..., intentPlaceholder: "Check this out" },
tiktok:      { ..., intentPlaceholder: "Worth watching?" },
spotify:     { ..., intentPlaceholder: "Listen to this" },
x_twitter:   { ..., intentPlaceholder: "Check this out" },
event:       { ..., intentPlaceholder: "Are you going?" },
generic:     { ..., intentPlaceholder: "What's the plan?" },
```

**Step 2: Commit**

```bash
git add lib/config/link-types.ts
git commit -m "feat: intent placeholder config per link type"
```

---

### Task 6: Create Form — Add Intent Input

**Files:**
- Modify: `components/create/create-form.tsx`

**Step 1: Add intentText state**

Add state variable:

```ts
const [intentText, setIntentText] = useState("");
```

**Step 2: Add intent input after preview card**

After the `LinkPreview` block and before the create button, add:

```tsx
{showPreview && (
  <Input
    value={intentText}
    onChange={(e) => setIntentText(e.target.value)}
    placeholder={linkTypeConfig[linkType].intentPlaceholder}
    disabled={state === "creating"}
    className="input-glass"
  />
)}
```

Import `linkTypeConfig` at the top:

```ts
import { linkTypeConfig } from "@/lib/config/link-types";
```

**Step 3: Pass intentText to the create API call**

In `handleCreate`, add `intentText` to the request body:

```ts
body: JSON.stringify({
  url: freeTextTitle ? null : input.trim(),
  jobId,
  title: metadata?.title ?? freeTextTitle,
  description: metadata?.description ?? null,
  linkType,
  primaryActionLabel: actionLabel,
  intentText: intentText.trim() || null,
}),
```

**Step 4: Reset intentText when input changes**

In the `onChange` handler for the main input, add:

```ts
setIntentText("");
```

alongside the other state resets.

**Step 5: Commit**

```bash
git add components/create/create-form.tsx
git commit -m "feat: intent text input in create flow"
```

---

### Task 7: Display Intent on Surface Card

**Files:**
- Modify: `components/surface/surface-card.tsx`

**Step 1: Add intent line between renderer and actions**

After `<Renderer space={space} theme={theme} />` and before the action section `<div className="space-y-5 ...">`, add the intent display:

```tsx
{space.intentText && (
  <motion.p
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.3 }}
    className="mt-6 mb-2 px-6 text-center text-[17px] font-medium text-cyan-200/80"
  >
    {space.intentText}
  </motion.p>
)}
```

**Step 2: Commit**

```bash
git add components/surface/surface-card.tsx
git commit -m "feat: display intent text on surface card"
```

---

### Task 8: Verify and PR — Intent Layer

**Step 1: Run tests**

Run: `bun run test`
Expected: All pass (no test changes needed — intentText is optional, existing tests still valid)

**Step 2: Manual test**

Run: `bun run dev`

1. Paste a Google Maps link → preview loads → intent field appears with "Friday 7PM?" placeholder
2. Type "Dinner at 8?" → click Create → surface page shows "Dinner at 8?" between content and action
3. Create a surface without intent text → no empty gap on surface page
4. Create a free text surface → intent field appears with "What's the plan?"

**Step 3: Push and create PR**

```bash
git push -u origin feat/intent-layer
gh pr create --base dev --title "feat: intent layer — creator intent text on surfaces" --body "$(cat <<'EOF'
## Summary
- New `intentText` column on Space model
- Optional intent input in create flow (placeholder adapts by link type)
- Intent displayed as centered accent text between content and action on surface card

## Test plan
- [ ] Create surface with intent text — displays correctly
- [ ] Create surface without intent text — no empty gap
- [ ] Intent placeholder adapts by link type (Maps: "Friday 7PM?", Video: "Worth watching?")
- [ ] All existing tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 4: Merge**

```bash
gh pr merge --squash --delete-branch
git checkout dev && git pull origin dev
```

---

# BRANCH 2: feat/ui-polish

Create branch from dev (with intent layer merged):

```bash
git checkout dev && git pull origin dev
git checkout -b feat/ui-polish
```

---

### Task 9: Input Glass Refinement

**Files:**
- Modify: `app/globals.css`

**Step 1: Update .input-glass styles**

Replace the `.input-glass` block:

```css
.input-glass {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: white !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.input-glass::placeholder {
  color: rgba(255, 255, 255, 0.35) !important;
}

.input-glass:focus {
  border-color: rgba(100, 200, 255, 0.25) !important;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(56, 189, 248, 0.12);
}
```

**Step 2: Update Input component padding**

In `components/ui/input.tsx`, change `py-4` to `py-5` in the className:

```ts
"w-full rounded-[var(--radius-lg)] border bg-surface px-5 py-5 text-base shadow-sm transition-colors",
```

**Step 3: Commit**

```bash
git add app/globals.css components/ui/input.tsx
git commit -m "fix: input glass refinement — softer border, inner shadow, diffused glow"
```

---

### Task 10: Button Hierarchy — Tertiary Share Button

**Files:**
- Modify: `components/surface/shared/secondary-actions.tsx`

**Step 1: Make "Share a link" tertiary**

Change the share button's className to remove border and background:

```tsx
<button
  onClick={handleShare}
  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white/40 transition-colors hover:text-white/60"
>
```

Keep "Open original" as-is (secondary ghost with border).

**Step 2: Reduce "Open original" border opacity slightly**

Change `border-white/10` to `border-white/8`:

```tsx
className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/5 px-5 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
```

**Step 3: Commit**

```bash
git add components/surface/shared/secondary-actions.tsx
git commit -m "fix: button hierarchy — share becomes tertiary, open original softer"
```

---

### Task 11: Relative Timestamp Utility

**Files:**
- Create: `lib/format-time.ts`
- Create: `lib/__tests__/format-time.test.ts`

**Step 1: Write failing tests**

```ts
// lib/__tests__/format-time.test.ts
import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "@/lib/format-time";

describe("formatRelativeTime", () => {
  const now = new Date("2026-02-21T20:00:00Z");

  it("returns 'just now' for < 1 minute", () => {
    const date = new Date("2026-02-21T19:59:30Z");
    expect(formatRelativeTime(date, now)).toBe("just now");
  });

  it("returns minutes for < 1 hour", () => {
    const date = new Date("2026-02-21T19:48:00Z");
    expect(formatRelativeTime(date, now)).toBe("12m ago");
  });

  it("returns hours for < 24 hours", () => {
    const date = new Date("2026-02-21T17:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("3h ago");
  });

  it("returns days for < 7 days", () => {
    const date = new Date("2026-02-19T20:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("2d ago");
  });

  it("returns weeks for < 30 days", () => {
    const date = new Date("2026-02-07T20:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("2w ago");
  });

  it("returns short date for >= 30 days", () => {
    const date = new Date("2026-01-15T20:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("Jan 15");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun run test`
Expected: FAIL — `formatRelativeTime` not found

**Step 3: Implement**

```ts
// lib/format-time.ts

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = now.getTime() - date.getTime();

  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / WEEK)}w ago`;

  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test`
Expected: All PASS

**Step 5: Commit**

```bash
git add lib/format-time.ts lib/__tests__/format-time.test.ts
git commit -m "feat: formatRelativeTime utility with tests"
```

---

### Task 12: Display Timestamp on Surface Card

**Files:**
- Modify: `components/surface/surface-card.tsx`

**Step 1: Import and add timestamp**

Add import:
```ts
import { formatRelativeTime } from "@/lib/format-time";
```

After the ghost URL echo (the last `motion.p` in the card), add:

```tsx
<motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.45, duration: 0.3 }}
  className="text-right text-[11px] text-white/20"
>
  {formatRelativeTime(space.createdAt)}
</motion.p>
```

**Step 2: Commit**

```bash
git add components/surface/surface-card.tsx
git commit -m "feat: relative timestamp on surface card"
```

---

### Task 13: Card Spacing Adjustments

**Files:**
- Modify: `components/surface/surface-card.tsx`

**Step 1: Add breathing room between renderer and action section**

The shared action section currently has `className="space-y-5 p-6 pt-5"`. Change to `p-6 pt-3` and use explicit spacing:

Wrap the intent + action area more explicitly. The intent `mt-6 mb-2` from Task 7 already provides spacing. Just ensure the action section `div` has `pt-0` so the intent's margin controls the gap.

If needed, adjust the renderer output wrapper to add `pb-1` for subtle extra air.

**Step 2: Commit**

```bash
git add components/surface/surface-card.tsx
git commit -m "fix: card spacing — more air between sections"
```

---

### Task 14: Soften Background Gradient Center

**Files:**
- Modify: `app/globals.css`

**Step 1: Add a radial overlay to .bg-aurora**

After the existing `bg-aurora` linear gradients, add a radial gradient that creates a slightly lighter zone at center:

Add a new `::before` pseudo-element or modify the existing gradient to include:

```css
.bg-aurora::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(0, 0, 0, 0.15) 0%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
}
```

This darkens/desaturates the center slightly so the glass card rests on a calmer zone. Adjust opacity to taste (0.10–0.20).

**Note:** Check that `.bg-aurora` doesn't already use `::after`. If it does, combine them. If `.bg-aurora` uses a pseudo-element for something else, add the radial gradient to the main background property instead.

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "fix: soften aurora gradient center for calmer card backdrop"
```

---

### Task 15: Verify and PR — UI Polish

**Step 1: Run tests**

Run: `bun run test`
Expected: All pass (including new formatRelativeTime tests)

**Step 2: Manual test**

Run: `bun run dev`

1. Homepage: input should feel glassier — near-invisible border, inner depth, smooth focus glow
2. Surface page: "Share a link" should be visually lighter than "Open original"
3. Surface page: relative timestamp visible bottom-right ("just now" for fresh surfaces)
4. Background: center zone slightly calmer where card sits

**Step 3: Push and create PR**

```bash
git push -u origin feat/ui-polish
gh pr create --base dev --title "fix: UI polish — glass input, button hierarchy, timestamp, gradient" --body "$(cat <<'EOF'
## Summary
- Input: softer border, inner shadow, diffused focus glow, more padding
- Button hierarchy: "Share a link" becomes tertiary (borderless)
- Relative timestamp bottom-right of card (just now, 3h ago, Feb 21)
- Aurora gradient softened at center for calmer card backdrop
- Card spacing adjustments

## Test plan
- [ ] Homepage input feels glassy (near-invisible border, smooth focus)
- [ ] Surface card: Share button is visually lighter than Open original
- [ ] Timestamp shows relative time (create fresh surface → "just now")
- [ ] Background gradient center is slightly calmer
- [ ] All tests pass (including new formatRelativeTime tests)

⚠️ This branch is independently revertable if the polish doesn't feel right.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 4: Merge (or hold for review)**

User decides whether to merge or revert.
