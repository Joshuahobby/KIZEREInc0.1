import { test, expect } from "@playwright/test";

test.describe("Item Management", () => {
    test("should display the search page", async ({ page }) => {
        await page.goto("/search");
        // Search page requires auth - should show AuthWall with the correct title
        await expect(
            page.getByRole('heading', { name: /Secure Registry Access/i })
        ).toBeVisible({ timeout: 15000 });
    });

    test("should navigate to register item from landing page", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("link", { name: /Register Now|Get Started/i }).first().click();
        await expect(page).toHaveURL(/\/auth/);
    });

    test("should display the landing page with feature sections", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText(/Secure What Matters Most|Smart Registry|Recovery/i).first()).toBeVisible();
    });
});
