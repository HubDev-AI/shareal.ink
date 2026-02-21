import { test, expect } from "@playwright/test";

test.describe("Input validation", () => {
  test("shows error for empty submit", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("input[placeholder*='Paste a link']");
    await input.press("Enter");
    await expect(page.locator("text=Paste a link or type a title")).toBeVisible();
  });
});

test.describe("Free text surface", () => {
  test("creates surface from plain text (no URL)", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill("Movie night at my place");
    await page.locator("button", { hasText: "Preview" }).click();

    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 10000 });

    await page.locator("button", { hasText: "Create shareable link" }).click();
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });

    await expect(page.locator("text=Movie night at my place")).toBeVisible();
  });
});

test.describe("QR Code", () => {
  test("QR button opens modal on surface page", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill("https://example.com/qr-test");
    await page.locator("button", { hasText: "Preview" }).click();
    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 15000 });
    await page.locator("button", { hasText: "Create shareable link" }).click();
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });

    await page.locator("button", { hasText: /QR/i }).click();

    await expect(page.locator("text=Scan to open")).toBeVisible();
    await expect(page.locator("button", { hasText: /Download/i })).toBeVisible();
  });
});
