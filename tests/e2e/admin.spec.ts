import { test, expect } from "@playwright/test";

test.describe("Admin Panel", () => {
    test("should redirect unauthenticated user from admin routes", async ({ page }) => {
        await page.goto("/admin/users");
        await page.waitForURL(/\/(auth|login)/, { timeout: 5000 }).catch(() => { });
        expect(page.url()).not.toContain("/admin/users");
    });

    test("should redirect unauthenticated user from roles management", async ({ page }) => {
        await page.goto("/admin/roles");
        await page.waitForURL(/\/(auth|login)/, { timeout: 5000 }).catch(() => { });
        expect(page.url()).not.toContain("/admin/roles");
    });

    test("should redirect unauthenticated user from audit logs", async ({ page }) => {
        await page.goto("/admin/audit-logs");
        await page.waitForURL(/\/(auth|login)/, { timeout: 5000 }).catch(() => { });
        expect(page.url()).not.toContain("/admin/audit-logs");
    });
});
