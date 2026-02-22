import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with Nyra hero and input field", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("input[placeholder*='Paste a link']")).toBeVisible();
    await expect(page.locator("img[alt*='Nyra']")).toBeVisible();
  });
});

test.describe("Surface creation — generic URL", () => {
  test("creates surface from URL and redirects", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill("https://example.com");
    await page.locator("button", { hasText: "Preview" }).click();

    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 15000 });

    await page.locator("button", { hasText: "Create shareable link" }).click();

    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/[A-Za-z0-9]{7}$/);
  });
});

test.describe("404 page", () => {
  test("shows not-found for invalid token", async ({ page }) => {
    await page.goto("/zzzzzzznotreal");
    await expect(page.getByRole("heading", { name: /doesn.t exist/i })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Copy button", () => {
  test("copy button is visible on surface page", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("input[placeholder*='Paste a link']");
    await input.fill("https://example.com/copy-test");
    await page.locator("button", { hasText: "Preview" }).click();
    await expect(page.locator("button", { hasText: "Create shareable link" })).toBeVisible({ timeout: 15000 });
    await page.locator("button", { hasText: "Create shareable link" }).click();
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/, { timeout: 10000 });

    await expect(page.locator("button", { hasText: /copy/i })).toBeVisible();
  });
});
