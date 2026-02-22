# Structured Text on Surfaces — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable multiline markdown text in the "What's the plan?" field and render it beautifully on surface pages.

**Architecture:** Replace the single-line `<input>` with an auto-growing `<textarea>` for input. Add `react-markdown` to render intentText as formatted markdown on surface pages. No schema or migration changes — markdown is just plain text.

**Tech Stack:** react-markdown, Tailwind CSS prose styling, React textarea with auto-resize

---

### Task 1: Install react-markdown

**Step 1: Install dependency**

Run: `bun add react-markdown`

**Step 2: Verify installation**

Run: `bun run build`
Expected: Build succeeds (react-markdown is ESM-compatible with Next.js 16)

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add react-markdown dependency"
```

---

### Task 2: Create Textarea component

**Files:**
- Create: `components/ui/textarea.tsx`

**Step 1: Create the auto-growing textarea**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useCallback, useEffect, useRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const resize = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => {
      resize();
    }, [props.value, resize]);

    return (
      <div className="w-full">
        <textarea
          ref={(node) => {
            internalRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          rows={1}
          className={cn(
            "w-full resize-none rounded-[var(--radius-lg)] border bg-surface px-5 py-5 text-base shadow-sm transition-colors",
            "placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
            error ? "border-red-400" : "border-border",
            className
          )}
          onChange={(e) => {
            onChange?.(e);
            resize();
          }}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/ui/textarea.tsx
git commit -m "feat: add auto-growing Textarea component"
```

---

### Task 3: Swap Input → Textarea in create-form

**Files:**
- Modify: `components/create/create-form.tsx`

**Step 1: Replace the intentText input**

In `create-form.tsx`:
1. Add import: `import { Textarea } from "@/components/ui/textarea";`
2. Replace the `<Input>` for intentText (around line 275-281) with:

```tsx
<Textarea
  value={intentText}
  onChange={(e) => setIntentText(e.target.value)}
  placeholder={linkTypeConfig[linkType].intentPlaceholder}
  disabled={state === "creating"}
  className="input-glass"
/>
```

3. Update `handleKeyDown` to NOT submit on Enter when in textarea (allow newlines). Change the handler:

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    if (state === "idle") {
      e.preventDefault();
      handleSubmitInput();
    } else if (state === "previewing") {
      // Only submit from the main input, not textarea
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") {
        e.preventDefault();
        handleCreate();
      }
    }
  }
};
```

**Step 2: Verify build and manual test**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/create/create-form.tsx
git commit -m "feat: swap intentText input to auto-growing textarea"
```

---

### Task 4: Raise MAX_INTENT_TEXT limit

**Files:**
- Modify: `app/api/spaces/route.ts:16`

**Step 1: Update the limit**

Change `MAX_INTENT_TEXT = 500` to `MAX_INTENT_TEXT = 2000` — multiline markdown content needs more room (matches MAX_DESCRIPTION).

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add 'app/api/spaces/route.ts'
git commit -m "feat: raise intentText limit to 2000 chars for markdown content"
```

---

### Task 5: Create IntentMarkdown component

**Files:**
- Create: `components/surface/shared/intent-markdown.tsx`

**Step 1: Create the markdown renderer**

```tsx
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface IntentMarkdownProps {
  text: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 text-[20px] font-bold text-cyan-100">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 text-[18px] font-semibold text-cyan-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 text-[16px] font-semibold text-cyan-100">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 text-[16px] leading-relaxed text-cyan-200/80">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 text-[15px] text-cyan-200/80">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 text-[15px] text-cyan-200/80">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-cyan-100">{children}</strong>
  ),
  em: ({ children }) => <em className="text-cyan-200/90">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 underline decoration-cyan-400/30 transition-colors hover:text-cyan-300"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-cyan-400/30 pl-3 text-cyan-200/60 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1.5 py-0.5 text-[14px] text-cyan-200/90">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-white/5 p-3 text-[14px]">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-3 border-white/10" />,
};

export function IntentMarkdown({ text }: IntentMarkdownProps) {
  return (
    <div className="mt-6 mb-2 px-6 text-center">
      <div className="text-left">
        <ReactMarkdown components={components}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
```

Note: `react-markdown` sanitizes HTML by default (no `dangerouslySetInnerHTML`, no raw HTML pass-through). Safe for user input.

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/surface/shared/intent-markdown.tsx
git commit -m "feat: add IntentMarkdown component for formatted surface text"
```

---

### Task 6: Integrate IntentMarkdown into SurfaceCard

**Files:**
- Modify: `components/surface/surface-card.tsx:33-42`

**Step 1: Replace the plain `<p>` tag**

1. Add import: `import { IntentMarkdown } from "./shared/intent-markdown";`
2. Replace the intentText `<motion.p>` block (lines 33-42):

```tsx
{space.intentText && (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.3 }}
  >
    <IntentMarkdown text={space.intentText} />
  </motion.div>
)}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/surface/surface-card.tsx
git commit -m "feat: render intentText as markdown on surface pages"
```

---

### Task 7: Run all tests and verify

**Step 1: Run unit tests**

Run: `bun run test`
Expected: All 25+ tests pass

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build, no errors

**Step 3: Final commit (if any fixups needed)**

---

### Task 8: Update validation for client-side textarea

**Files:**
- Modify: `lib/validation.ts` (if intentText validation exists client-side)

**Step 1: Check if client-side validation caps intentText**

Look at `parseInput()` and any client-side length checks. If `MAX_INTENT_TEXT` is referenced client-side, update to match the new 2000 limit.

**Step 2: Run tests**

Run: `bun run test`
Expected: All tests pass

**Step 3: Commit if changed**

```bash
git commit -m "fix: align client-side intentText limit with API (2000)"
```
