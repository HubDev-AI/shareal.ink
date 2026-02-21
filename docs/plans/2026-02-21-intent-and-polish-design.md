# Intent Layer + UI Polish — Design Document

**Date:** 2026-02-21
**Status:** Approved

---

## What

Three separate features shipped as three branches:

1. **Intent Layer** (`feat/intent-layer`): Add creator intent text ("Friday 7PM?") to surfaces. This transforms the product from a pretty link wrapper into structured intention.
2. **UI Polish** (`feat/ui-polish`): Cosmetic refinements — softer input, button hierarchy, card spacing, relative timestamp, gradient softening.
3. **Intent System** (`feat/intent-system`): intentType selector (meet/vote/share), auto-inference from text, vote action UI, adaptive backgrounds per link type.

## Why

The current surface shows Content + Action but is missing the human layer — the *why* behind the link. Without intent, it's a polished link shortener. With intent, it becomes a planning surface.

The UI polish elevates from "nice" to "distinct" — Linear meets Apple meets minimal event invite.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Intent input placement | After preview, always optional | Low friction — appears naturally in flow, doesn't force input |
| Intent display | Centered between renderer + action, accent color | Intent is the emotional bridge — must feel central, not metadata |
| Background gradient | Subtle adaptive tint per link type | 5-10% hue shift, barely noticeable, subconsciously contextual |
| Branches | Three separate branches | Intent layer → UI polish (revertable) → intent system (vote/meet/share + backgrounds) |
| Intent type selection | Auto-infer + manual override pills | Best UX — smart defaults, creator always has control |
| Action per intent | meet=RSVP, vote=Yes/No, share=no button | Intent drives action, not link type |
| Timestamp | Relative time, bottom-right, whisper opacity | Provenance without competing with content |

---

## Branch 1: Intent Layer

### DB Migration

Add nullable `intentText` column to Space:

```prisma
intentText String? @map("intent_text")
```

### Create Flow

After the preview card appears, an optional intent input fades in:

```
[Paste a link or type anything...]     [Preview]

  ┌─ Preview Card ─────────────────┐
  │  Title, image, etc.            │
  └────────────────────────────────┘

  [ What's the plan? (optional) ]     ← new intent input, same glass styling

  [ Create shareable link ]
```

Placeholder adapts by link type:
- `google_maps`, `event`: "Friday 7PM?"
- `youtube`, `tiktok`: "Worth watching?"
- `spotify`: "Listen to this"
- `instagram`, `x_twitter`: "Check this out"
- `generic`: "What's the plan?"

### API Changes

`POST /api/spaces` accepts optional `intentText` field and stores it.

`SpaceData` type gets `intentText: string | null`.

SSR page passes `intentText` through to the SurfaceCard.

### Surface Display

In `SurfaceCard`, between the renderer output and the action button:

```
[Renderer output — map, video, image, title, description]

    "Friday · 7PM?"              ← intent line

    [ I'm in ]                   ← primary action
    3 people in                  ← response counter
    [Open original] [Share]      ← secondary actions
```

Intent line styling:
- `text-[17px]` — larger than description, smaller than title
- `text-cyan-200/80` — soft accent color
- Centered
- `mt-6 mb-2` — generous breathing room
- If no intentText, space closes up naturally (no empty gap)

---

## Branch 2: UI Polish

### Input Refinement

Make the homepage input feel like glass, not a form field:

- Border: `rgba(255,255,255,0.15)` → `rgba(255,255,255,0.08)` at rest
- Inner shadow: `inset 0 1px 2px rgba(0,0,0,0.2)`
- Focus glow: sharp ring → diffused `0 0 20px rgba(56,189,248,0.12)`
- Vertical padding: `py-4` → `py-5`

### Button Hierarchy

Current: "Open original" and "Share a link" have equal weight.

Fix:
- Primary action ("I'm in"): stays white/bold — already dominant
- "Open original": secondary ghost button (keep current, slightly reduce border)
- "Share a link": tertiary — no border, `text-white/40 hover:text-white/60`

### Card Spacing

- More air between renderer output and action section
- Generous vertical spacing around intent line

### Background Gradient

Soften the aurora gradient at center where the card sits. Add a lighter/less saturated radial zone so the card rests on calm space rather than competing with the background.

### Timestamp

Relative creation time, bottom-right of card:

```
https://maps.app.goo.gl/...
                                    2h ago
```

Styling: `text-[11px] text-white/20` — same whisper level as ghost URL.

Format:
| Age | Display |
|-----|---------|
| < 1 min | just now |
| < 60 min | 12m ago |
| < 24h | 3h ago |
| < 7d | 2d ago |
| < 30d | 2w ago |
| >= 30d | Feb 21 |

Simple `formatRelativeTime()` utility, no library.

---

## Branch 3: Intent System

### Intent Type Selector (Create Flow)

After preview and intent text input, show 3 pill buttons:

```
[Preview Card]
[ What's the plan? ]              ← intent text input
  (Meet)  (Vote)  (Share)         ← intent type pills, one pre-selected
[ Create shareable link ]
```

**Auto-inference from intent text:**
- Text contains `?` → `vote`
- Text matches time-like patterns (days of week, AM/PM, "tonight", "tomorrow") → `meet`
- Everything else (or empty) → default from link type config

**Link type defaults:**
- `google_maps`, `event` → `meet`
- All others → `share`

Creator can always tap a different pill to override the inference.

### Action Button Adapts by intentType

| intentType | Surface action | Behavior |
|------------|---------------|----------|
| `meet` | **[ I'm in ]** | RSVP counter (existing) |
| `vote` | **[ Yes ]  [ No ]** | Two buttons, tallied separately |
| `share` | *(no action button)* | Content + intent + secondary actions only |

For `vote`: uses existing `ResponseType = "yes" | "no"` in the DB. ActionButton gets a vote variant showing two buttons with separate counts.

For `share`: no interactive action. The surface is pure — content, intent, "Open original" / "Share a link."

### Adaptive Backgrounds

Subtle per-link-type tinting via CSS custom properties on the aurora gradient:

| Link type | Hue | Mood |
|-----------|-----|------|
| `google_maps` | warm amber | place, grounded |
| `youtube` | warm red | energy |
| `instagram` | pink-purple | creative |
| `tiktok` | neutral | dark, focused |
| `spotify` | green | calm, musical |
| `x_twitter` | blue | informational |
| `event` | purple | social |
| `generic` | no shift | neutral stage |

Implementation: theme config provides a CSS class per link type. The surface page applies it to the `<main>` element. The `bg-aurora` gradient uses CSS variables for its color stops, and each link type class overrides those variables with a 5-10% tint.

### The Universal Pattern Validated

The influencer Amazon use case proves the system works without special renderers:

1. Paste `amazon.com/dp/...` → `generic` type
2. OG scraper gets product image + title + price
3. GenericRenderer displays it
4. Creator types "Should I buy this?" → auto-infers `vote`
5. Surface: product image → title → "Should I buy this?" → [Yes] [No]

Same structure, same stage, different content + intent.

---

## Not In Scope

- Surface expiration logic (column `expiresAt` already exists in DB)
- Admin dashboard
- Authentication
