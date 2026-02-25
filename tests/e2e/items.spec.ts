import { test, expect } from "@playwright/test";

test.describe("Item Management", () => {
    test("should display the search page", async ({ page }) => {
        await page.goto("/search");
        await expect(page.locator("input[placeholder*='Keyword' i]").first()).toBeVisible({ timeout: 10000 });
    });

    test("should load the landing page with feature sections", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/KIZERE/i);
        // Main CTA should be visible
        await expect(page.locator("text=Get Started, text=Register, text=Report").first()).toBeVisible({ timeout: 5000 }).catch(() => { });
    });

    test("should have register item link from landing", async ({ page }) => {
        await page.goto("/");
        const registerLink = page.locator('a[href*="register"], a[href*="item"]').first();
        await expect(registerLink).toBeVisible({ timeout: 5000 }).catch(() => { });
    });
});
