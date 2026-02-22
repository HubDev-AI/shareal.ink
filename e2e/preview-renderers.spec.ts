import { test, expect } from "@playwright/test";

/**
 * E2E tests for preview renderers on the homepage create form.
 * Verifies that each link type shows the correct TypeBadge and
 * renderer-specific visual elements in the preview card.
 *
 * Runs serially to avoid hitting the rate limiter (20 req/min per IP).
 */
test.describe.configure({ mode: "serial" });

const PREVIEW_CASES = [
  { name: "YouTube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", badge: "Video" },
  { name: "Spotify", url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT", badge: "Spotify" },
  { name: "Instagram", url: "https://www.instagram.com/p/C1234567/", badge: "Instagram" },
  { name: "TikTok", url: "https://www.tiktok.com/@user/video/123456789", badge: "TikTok" },
  { name: "Google Maps", url: "https://maps.google.com/maps?q=Central+Park", badge: "Place" },
  { name: "X/Twitter", url: "https://x.com/user/status/123456789", badge: "Post" },
  { name: "PDF", url: "https://example.com/document.pdf", badge: "PDF" },
  { name: "Google Doc", url: "https://docs.google.com/document/d/abc123/edit", badge: "Google Doc" },
  { name: "Image", url: "https://example.com/photo.jpg", badge: "Image" },
  { name: "Generic", url: "https://example.com/blog-post", badge: "Link" },
];

for (const { name, url, badge } of PREVIEW_CASES) {
  test(`preview shows "${badge}" badge for ${name} link`, async ({ page }) => {
    await page.goto("/");

    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill(url);
    await page.locator("button", { hasText: "Preview" }).click();

    // TypeBadge should appear after the API returns linkType
    const badgeEl = page.locator("span", { hasText: badge }).first();
    await expect(badgeEl).toBeVisible({ timeout: 15000 });
  });
}

test("PDF preview shows document icon area", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("input[placeholder*='Paste a link']");
  await input.fill("https://example.com/report.pdf");
  await page.locator("button", { hasText: "Preview" }).click();

  // Wait for the badge first (confirms preview loaded)
  await expect(page.locator("span", { hasText: "PDF" }).first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator("text=PDF Document")).toBeVisible();
});

test("Google Doc preview shows sub-type label", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("input[placeholder*='Paste a link']");
  await input.fill("https://docs.google.com/document/d/abc123/edit");
  await page.locator("button", { hasText: "Preview" }).click();

  await expect(page.locator("text=Google Doc").first()).toBeVisible({ timeout: 15000 });
});

test("Google Sheets preview shows Sheets sub-type", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("input[placeholder*='Paste a link']");
  await input.fill("https://sheets.google.com/spreadsheets/d/abc123");
  await page.locator("button", { hasText: "Preview" }).click();

  await expect(page.locator("text=Google Sheets")).toBeVisible({ timeout: 15000 });
});

test("Google Slides preview shows Slides sub-type", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("input[placeholder*='Paste a link']");
  await input.fill("https://slides.google.com/presentation/d/abc123");
  await page.locator("button", { hasText: "Preview" }).click();

  await expect(page.locator("text=Google Slides")).toBeVisible({ timeout: 15000 });
});

test("preview shows Create button after preview loads", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("input[placeholder*='Paste a link']");
  await input.fill("https://example.com/test");
  await page.locator("button", { hasText: "Preview" }).click();

  await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 15000 });
});
