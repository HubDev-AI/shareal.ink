# Structured Text on Surfaces — Design

**Date**: 2026-02-22
**Status**: Approved

## Problem

When users paste structured text (headings, lists, options A/B/C/D) into the "What's the plan?" field, it renders as a flat unformatted paragraph on the surface page because:

1. The input is a single-line `<input>` — cannot accept multiline text
2. The surface renders intentText as a plain `<p>` tag — no formatting

## Solution

Three changes, no schema migration required.

### 1. Auto-growing Textarea Component

Create `components/ui/textarea.tsx` — a `<textarea>` that auto-grows to fit content.

- Same glass styling as current Input (`input-glass`)
- Paste-friendly: handles multiline paste from notes, docs, chat apps
- Replaces `<Input>` for the intentText field in create-form.tsx

### 2. Markdown Rendering on Surfaces

Add `react-markdown` (~12kB gzip) for rendering intentText on surface pages.

- New `components/surface/shared/intent-markdown.tsx` wraps `react-markdown`
- Custom Tailwind prose styling for dark surface theme (cyan-tinted text, proper spacing)
- Custom component overrides for headings, lists, bold, links to match glass card aesthetic
- Replaces the plain `<p>` tag in `surface-card.tsx`

### 3. No Schema Changes

`intentText` stays as `String?` — markdown is just plain text stored the same way.

## Supported Formatting

After implementation, surfaces will render:

- Headings (`##`)
- Bullet and numbered lists
- Bold / italic emphasis
- Line breaks and paragraphs
- Links (clickable)
- Blockquotes and code blocks

## Files Changed

| File | Change |
|------|--------|
| `components/ui/textarea.tsx` | New — auto-growing textarea |
| `components/create/create-form.tsx` | Swap Input → Textarea for intentText |
| `components/surface/shared/intent-markdown.tsx` | New — markdown renderer |
| `components/surface/surface-card.tsx` | Swap `<p>` → IntentMarkdown |
| `package.json` | Add react-markdown |
