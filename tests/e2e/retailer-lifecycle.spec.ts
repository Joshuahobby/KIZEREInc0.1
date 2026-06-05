import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
const AUTH_DIR = path.join(process.cwd(), "playwright/.auth");
const retailerAuthPath = path.join(AUTH_DIR, "retailer.json");

/**
 * Retailer Hub Lifecycle E2E Test
 *
 * Covers the complete RETAIL HUB journey as a seeded test retailer:
 * Phase 1 — Dashboard navigation and stat cards
 * Phase 2 — Customer Directory and Add Customer dialog
 * Phase 3 — POS checkout flow (customer ID → product info → receipt)
 * Phase 4 — Receipt generation (QR code present)
 * Phase 5 — Analytics page renders charts
 *
 * Prerequisite: global-setup.ts must have run and saved playwright/.auth/retailer.json
 */

test.describe("Retailer Hub Lifecycle", () => {
  test.use({
    storageState: retailerAuthPath,
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!fs.existsSync(retailerAuthPath)) {
      testInfo.skip(true, "playwright/.auth/retailer.json not found — run global setup first");
    }
  });

  test("should complete the full retailer hub lifecycle", async ({ page }) => {
    test.setTimeout(120000);

    // ── Phase 1: Dashboard ──────────────────────────────────────────────────
    console.log("--- Phase 1: Dashboard ---");
    await page.goto("/retailer/dashboard");
    await expect(page).toHaveURL(/\/retailer\/dashboard/i, { timeout: 15000 });

    // Stat cards should render (even if values are 0)
    await expect(
      page.locator('[class*="card"], [class*="stat"]').first()
    ).toBeVisible({ timeout: 15000 });
    console.log("Dashboard loaded");

    // ── Phase 2: Customer Directory ─────────────────────────────────────────
    console.log("--- Phase 2: Customer Directory ---");
    await page.goto("/retailer/customers");
    await expect(page).toHaveURL(/\/retailer\/customers/i, { timeout: 10000 });

    // Table header should be visible
    await expect(
      page.getByRole("columnheader", { name: /Customer/i })
    ).toBeVisible({ timeout: 15000 });
    console.log("Customer table visible");

    // Open Add Customer dialog
    await page.getByRole("button", { name: /Add Customer/i }).click();
    await expect(
      page.getByRole("dialog").getByLabel(/National ID|Passport/i)
    ).toBeVisible({ timeout: 8000 });
    console.log("Add Customer dialog opened");

    // Fill and submit
    await page.getByRole("dialog").getByLabel(/Full Name/i).fill("E2E Lifecycle Customer");
    await page.getByRole("dialog").getByLabel(/National ID|Passport/i).fill(`199${Date.now().toString().slice(-10)}`);
    await page.getByRole("dialog").getByRole("button", { name: /Add Customer/i }).click();

    // Dialog should close (either success toast or form reset)
    await page.waitForTimeout(2000);
    const dialogStillOpen = await page.getByRole("dialog").isVisible().catch(() => false);
    if (dialogStillOpen) {
      // Close it manually if it stayed open with an error (e.g. duplicate NID)
      await page.keyboard.press("Escape");
    }
    console.log("Add Customer submitted");

    // ── Phase 3: POS Checkout ───────────────────────────────────────────────
    console.log("--- Phase 3: POS Checkout ---");
    await page.goto("/pos");
    await expect(page).toHaveURL(/\/pos/i, { timeout: 10000 });
    await expect(page.getByText(/Customer Identification/i)).toBeVisible({ timeout: 15000 });

    // Step 1: Customer lookup
    const nidInput = page.locator('input[name="nationalId"], input[placeholder*="ID"]').first();
    await nidInput.fill(`E2E${Date.now()}`);
    const nameInput = page.locator('input[name="fullName"], input[placeholder*="name" i]').first();
    await nameInput.fill("E2E POS Customer");

    await page.getByRole("button", { name: /Find|Create|Look/i }).first().click();
    console.log("Customer lookup submitted");

    // Step 2: Product info should appear
    await expect(
      page.getByText(/Product Information|Item Details|Serial/i).first()
    ).toBeVisible({ timeout: 15000 });

    const serialInput = page.locator('input[name="serialNumber"], input[placeholder*="serial" i]').first();
    const uniqueSerial = `E2E-LC-${Date.now()}`;
    await serialInput.fill(uniqueSerial);

    const productNameInput = page.locator('input[name="name"], input[placeholder*="product name" i], input[placeholder*="item name" i]').first();
    await productNameInput.fill("E2E Lifecycle Laptop");

    await page.getByRole("button", { name: /Register|Submit|Confirm/i }).first().click();
    console.log("Product registration submitted");

    // ── Phase 4: Receipt ────────────────────────────────────────────────────
    console.log("--- Phase 4: Receipt ---");
    await expect(
      page.getByText(/Registration Complete|Success|Receipt/i).first()
    ).toBeVisible({ timeout: 20000 });

    // QR code SVG should be present
    const qrCode = page.locator("svg").filter({ has: page.locator("rect, path") }).first();
    await expect(qrCode).toBeVisible({ timeout: 10000 });
    console.log("Receipt with QR code visible");

    // ── Phase 5: Analytics ──────────────────────────────────────────────────
    console.log("--- Phase 5: Analytics ---");
    await page.goto("/retailer/analytics");
    await expect(page).toHaveURL(/\/retailer\/analytics/i, { timeout: 10000 });

    await expect(
      page.getByText(/Total Registrations|Analytics|Insights/i).first()
    ).toBeVisible({ timeout: 15000 });

    // Chart container should render
    const chartContainer = page.locator(".recharts-responsive-container, canvas, [class*='chart']").first();
    await expect(chartContainer).toBeVisible({ timeout: 15000 });
    console.log("Analytics with chart visible");
    console.log("=== Lifecycle COMPLETE ===");
  });
});
