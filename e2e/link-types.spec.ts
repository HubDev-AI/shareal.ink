import { test, expect } from "@playwright/test";

const LINK_TYPES = [
  { name: "YouTube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { name: "Spotify", url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT" },
  { name: "Instagram", url: "https://www.instagram.com/p/C1234567/" },
  { name: "TikTok", url: "https://www.tiktok.com/@user/video/123456789" },
  { name: "Google Maps", url: "https://maps.google.com/maps?q=Central+Park" },
  { name: "X/Twitter", url: "https://x.com/user/status/123456789" },
  { name: "Event", url: "https://www.eventbrite.com/e/test-event-123" },
  { name: "PDF", url: "https://example.com/document.pdf" },
  { name: "Google Doc", url: "https://docs.google.com/document/d/abc123/edit" },
  { name: "Image", url: "https://example.com/photo.jpg" },
  { name: "Generic", url: "https://example.com/blog-post" },
];

for (const { name, url } of LINK_TYPES) {
  test(`creates surface for ${name} link`, async ({ page }) => {
    await page.goto("/");

    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill(url);
    await page.locator("button", { hasText: "Preview" }).click();

    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 20000 });

    await page.locator("button", { hasText: "Create shareable link" }).click();

    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });
  });
}
