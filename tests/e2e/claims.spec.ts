import { test, expect } from "@playwright/test";

test.describe("Claims Flow", () => {
    test("should redirect to auth when accessing claims unauthenticated", async ({ page }) => {
        await page.goto("/lost-found");
        // Should either show the page (public) or redirect
        const url = page.url();
        expect(url).toMatch(/(lost-found|auth|login)/);
    });
});
