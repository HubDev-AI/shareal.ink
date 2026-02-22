# SEO Design — 2026-02-22

> Pure technical SEO for shareal.ink: robots.txt, sitemap, meta tags, structured data, noindex surfaces. Zero visual or functionality changes.

---

## Goals

- Make the homepage discoverable by search engines
- Prevent surface pages from being indexed (ephemeral, user-generated content)
- Provide structured data so Google understands what shareal.ink is
- Fix missing canonical URLs and OG tags on the homepage

## Constraints

- **No UI changes** — nothing visible to users changes
- **No functionality changes** — no new features or behavior
- **Homepage only indexed** — surfaces are noindex

---

## 1. robots.txt

**File:** `app/robots.ts` (Next.js Metadata API)

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://shareal.ink/sitemap.xml",
  };
}
```

Disallows crawling API routes. Points to sitemap.

---

## 2. sitemap.xml

**File:** `app/sitemap.ts` (Next.js Metadata API)

```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://shareal.ink",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
```

Only includes the homepage. Surface pages are excluded.

---

## 3. noindex on Surface Pages

**File:** `app/[token]/page.tsx` — modify `generateMetadata`

Add `robots: "noindex, nofollow"` to the returned metadata object. Prevents Google from indexing individual surface pages.

---

## 4. metadataBase in Root Layout

**File:** `app/layout.tsx`

Add `metadataBase: new URL("https://shareal.ink")` to the exported `metadata` object. This:
- Sets canonical URLs automatically
- Resolves relative OG image URLs correctly

Use `process.env.NEXT_PUBLIC_APP_URL` with fallback to `https://shareal.ink`.

---

## 5. Enhanced Homepage Meta Tags

**File:** `app/layout.tsx` — update `metadata` export

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink"),
  title: "shareal.ink — Turn any link into a surface",
  description:
    "Links get buried in Slack, lost in WhatsApp, forgotten in Discord. shareal.ink turns any link into a structured, intent-aware surface your group can act on.",
  // ... existing icons ...
};
```

---

## 6. OG & Twitter Tags for Homepage

**File:** `app/layout.tsx` — add to `metadata` export

```ts
openGraph: {
  title: "shareal.ink — Turn any link into a surface",
  description: "Links get buried in Slack, lost in WhatsApp, forgotten in Discord. shareal.ink turns any link into a structured, intent-aware surface your group can act on.",
  url: "https://shareal.ink",
  siteName: "shareal.ink",
  type: "website",
},
twitter: {
  card: "summary",
  title: "shareal.ink — Turn any link into a surface",
  description: "Links get buried in Slack, lost in WhatsApp, forgotten in Discord. shareal.ink turns any link into a structured, intent-aware surface your group can act on.",
},
```

---

## 7. JSON-LD Structured Data

**File:** `app/page.tsx` — add invisible `<script>` tag

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "shareal.ink",
      url: "https://shareal.ink",
      description: "Turn any link into a structured, intent-aware surface your group can act on.",
      applicationCategory: "SocialNetworkingApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    }),
  }}
/>
```

Tells Google this is a free web application in the social networking category.

---

## Files Changed

| File | Change |
|------|--------|
| `app/robots.ts` | **Create** — robots.txt via Metadata API |
| `app/sitemap.ts` | **Create** — sitemap.xml via Metadata API |
| `app/layout.tsx` | **Modify** — metadataBase, enhanced title/description, OG/Twitter tags |
| `app/[token]/page.tsx` | **Modify** — add `robots: "noindex, nofollow"` to generateMetadata |
| `app/page.tsx` | **Modify** — add JSON-LD structured data script |

## No New Dependencies

All changes use built-in Next.js Metadata API and standard HTML. No packages needed.
