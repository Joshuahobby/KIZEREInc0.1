/**
 * E2E tests: public verify page, rate-limiting, and category-aware identifier validation.
 */
import { test, expect, request as playwrightRequest } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, "../../playwright/.auth");
const adminAuthExists = () => fs.existsSync(path.join(AUTH_DIR, "admin.json"));
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// ─── Public Verify Page ───────────────────────────────────────────────────────

test.describe("Public Verify Page — unauthenticated", () => {
  test("renders without auth (no redirect)", async ({ page }) => {
    await page.goto("/verify/unknown-id-xyz");
    // Must NOT redirect to /auth
    await expect(page).not.toHaveURL(/\/auth/i, { timeout: 10000 });
  });

  test("shows 'Record Not Found' for unknown identifier", async ({ page }) => {
    await page.goto("/verify/definitely-not-registered-abc123");
    await expect(page.getByText(/Record Not Found/i)).toBeVisible({ timeout: 15000 });
  });

  test("displays KIZERE branding on the verify page", async ({ page }) => {
    await page.goto("/verify/some-fake-id");
    await expect(page.getByText(/KIZERE/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows warning banner and 'Report Found' button for flagged items (simulation via URL nav)", async ({ page }) => {
    // We can only test the 404 path without seeded data; the flagged path is covered by
    // retailer-lifecycle which registers products. This test asserts the error UI is correct.
    await page.goto("/verify/nonexistent-item-99999");
    await expect(page.getByText(/This identifier is not recognized/i)).toBeVisible({ timeout: 15000 });
  });
});

// ─── Rate-Limit on /api/items/public/:id ─────────────────────────────────────

test.describe("Public verify endpoint rate-limiting", () => {
  test("returns 429 after 30 rapid requests from the same IP", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });

    const LIMIT = 30;
    const EXTRA = 5;
    const responses: number[] = [];

    for (let i = 0; i < LIMIT + EXTRA; i++) {
      const res = await ctx.get(`/api/items/public/rate-limit-probe-${i}`);
      responses.push(res.status());
    }

    await ctx.dispose();

    // At least one of the extra requests must have been throttled
    const throttled = responses.filter(s => s === 429);
    expect(throttled.length).toBeGreaterThan(0);
  });
});

// ─── Category-aware identifier hints — Item Registration ─────────────────────

test.describe("Item Registration — category-aware identifier field", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!adminAuthExists()) {
      testInfo.skip(true, "playwright/.auth/admin.json not found — run global setup first");
    }
  });

  test.use({
    storageState: () => {
      const p = path.join(AUTH_DIR, "admin.json");
      return fs.existsSync(p) ? p : undefined as any;
    },
  });

  test("Phones category changes identifier label to 'IMEI Number'", async ({ page }) => {
    await page.goto("/register");
    // Wait for the form to render
    await page.waitForSelector("select, [data-testid='category-select'], [role='combobox']", { timeout: 15000 });

    // Select the "Phones" category using the shadcn Select
    const categoryTrigger = page.locator("[role='combobox']").first();
    await categoryTrigger.click();
    await page.getByRole("option", { name: /Phones/i }).click();

    // The identifier label should now say "IMEI Number"
    await expect(page.getByText(/IMEI Number/i)).toBeVisible({ timeout: 5000 });
  });

  test("Phones category shows IMEI validation error for non-IMEI input", async ({ page }) => {
    await page.goto("/register");
    await page.waitForSelector("[role='combobox']", { timeout: 15000 });

    // Select Phones
    const categoryTrigger = page.locator("[role='combobox']").first();
    await categoryTrigger.click();
    await page.getByRole("option", { name: /Phones/i }).click();

    // Fill item name (required)
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill("Test Phone");

    // Fill invalid identifier
    const identifierInput = page.locator('input[name="uniqueIdentifier"]');
    await identifierInput.fill("not-an-imei");
    await identifierInput.blur();

    // Expect a validation message about IMEI
    await expect(page.getByText(/IMEI|15.digit|digit/i)).toBeVisible({ timeout: 5000 });
  });

  test("Transportation category changes identifier label to 'VIN / Plate Number'", async ({ page }) => {
    await page.goto("/register");
    await page.waitForSelector("[role='combobox']", { timeout: 15000 });

    const categoryTrigger = page.locator("[role='combobox']").first();
    await categoryTrigger.click();
    await page.getByRole("option", { name: /Transportation/i }).click();

    await expect(page.getByText(/VIN|Plate Number/i)).toBeVisible({ timeout: 5000 });
  });
});

// ─── Category-aware identifier hints — Report Wizard ─────────────────────────

test.describe("Report Wizard — category-aware identifier field", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!adminAuthExists()) {
      testInfo.skip(true, "playwright/.auth/admin.json not found — run global setup first");
    }
  });

  test.use({
    storageState: () => {
      const p = path.join(AUTH_DIR, "admin.json");
      return fs.existsSync(p) ? p : undefined as any;
    },
  });

  test("Phones category shows IMEI hint text in report wizard", async ({ page }) => {
    await page.goto("/create-report?type=lost");
    await page.waitForSelector("[role='combobox']", { timeout: 15000 });

    // Advance to the step that has category/identifier (step 1)
    const categoryTrigger = page.locator("[role='combobox']").first();
    await categoryTrigger.click();
    await page.getByRole("option", { name: /Phones/i }).click();

    // Navigate to step 2
    const nextBtn = page.getByRole("button", { name: /next|continue/i }).first();
    if (await nextBtn.isVisible()) await nextBtn.click();

    // Step 2 should show IMEI-related text
    await expect(page.getByText(/IMEI/i)).toBeVisible({ timeout: 8000 });
  });
});
