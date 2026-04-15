import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const AUTH_DIR = path.join(__dirname, "../../playwright/.auth");
const retailerAuthExists = () => fs.existsSync(path.join(AUTH_DIR, "retailer.json"));
const adminAuthExists = () => fs.existsSync(path.join(AUTH_DIR, "admin.json"));

// ─── Unauthenticated redirect tests (no auth required) ───────────────────────

test.describe("POS — Unauthenticated redirects", () => {
  test("redirects /pos to auth when not logged in", async ({ page }) => {
    await page.goto("/pos");
    await page.waitForURL(/\/(auth|login)/i, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(auth|login)/i);
  });

  test("redirects /retailer/dashboard to auth when not logged in", async ({ page }) => {
    await page.goto("/retailer/dashboard");
    await page.waitForURL(/\/(auth|login)/i, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(auth|login)/i);
  });

  test("redirects /retailer/transactions to auth when not logged in", async ({ page }) => {
    await page.goto("/retailer/transactions");
    await page.waitForURL(/\/(auth|login)/i, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(auth|login)/i);
  });
});

// ─── Retailer-authenticated tests ────────────────────────────────────────────

test.describe("POS Terminal — Authenticated Retailer", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!retailerAuthExists()) {
      testInfo.skip(true, "playwright/.auth/retailer.json not found — run global setup first");
    }
  });

  test.use({
    storageState: () => {
      const p = path.join(AUTH_DIR, "retailer.json");
      return fs.existsSync(p) ? p : undefined as any;
    },
  });

  test("Retailer Dashboard loads with stat cards", async ({ page }) => {
    await page.goto("/retailer/dashboard");
    await expect(page).toHaveURL(/\/retailer\/dashboard/i, { timeout: 15000 });
    await expect(
      page.getByText(/Total Products|Dashboard|Retailer/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("POS Terminal renders customer identification step", async ({ page }) => {
    await page.goto("/pos");
    await expect(page).toHaveURL(/\/pos/i, { timeout: 10000 });
    await expect(page.getByText(/Customer Identification/i)).toBeVisible({ timeout: 15000 });
  });

  test("Transaction History page loads with table", async ({ page }) => {
    await page.goto("/retailer/transactions");
    await expect(page).toHaveURL(/\/retailer\/transactions/i, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /Transaction History/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("Customer Directory page loads", async ({ page }) => {
    await page.goto("/retailer/customers");
    await expect(page).toHaveURL(/\/retailer\/customers/i, { timeout: 10000 });
    await expect(
      page.getByText(/Customer Directory|All Customers/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("Analytics page loads with stat cards", async ({ page }) => {
    await page.goto("/retailer/analytics");
    await expect(page).toHaveURL(/\/retailer\/analytics/i, { timeout: 10000 });
    await expect(
      page.getByText(/Analytics|Total Registrations|Insights/i).first()
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── POS Terminal — Mobile Viewport ──────────────────────────────────────────

test.describe("POS Terminal — Mobile Viewport", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!retailerAuthExists()) {
      testInfo.skip(true, "playwright/.auth/retailer.json not found — run global setup first");
    }
  });

  test.use({
    storageState: () => {
      const p = path.join(AUTH_DIR, "retailer.json");
      return fs.existsSync(p) ? p : undefined as any;
    },
    viewport: { width: 390, height: 844 }, // iPhone 14 dimensions
  });

  test("desktop aside is hidden on mobile", async ({ page }) => {
    await page.goto("/pos");
    await expect(page).toHaveURL(/\/pos/i, { timeout: 10000 });
    // The aside uses hidden md:flex — should not be visible on 390px viewport
    const aside = page.locator("aside");
    await expect(aside).toBeHidden({ timeout: 10000 });
  });

  test("mobile step indicator appears after selecting a scenario", async ({ page }) => {
    await page.goto("/pos");
    await expect(page).toHaveURL(/\/pos/i, { timeout: 10000 });

    // The step indicator is only rendered when step !== "scenario"
    // Click the first scenario card (Register New Product / Stock In)
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();
    if (await scenarioCard.count() === 0) {
      // Fall back to clicking any clickable scenario button visible on screen
      await page.getByRole("button").filter({ hasText: /Register|Stock|Transfer|Return/i }).first().click();
    } else {
      await scenarioCard.click();
    }

    // After scenario selection, step changes and mobile step indicator renders
    const stepIndicator = page.locator(".md\\:hidden").filter({ hasText: /Customer|Product|Confirm/i });
    await expect(stepIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test("mobile bottom nav bar is visible with Dashboard and Reset links", async ({ page }) => {
    await page.goto("/pos");
    await expect(page).toHaveURL(/\/pos/i, { timeout: 10000 });

    // Fixed bottom nav rendered at all times on mobile
    const dashboardBtn = page.locator(".fixed.bottom-0").getByText("Dashboard");
    const resetBtn = page.locator(".fixed.bottom-0").getByText(/Reset Session/i);

    await expect(dashboardBtn).toBeVisible({ timeout: 10000 });
    await expect(resetBtn).toBeVisible({ timeout: 10000 });
  });

  test("scenario cards are tappable and advance the flow on mobile", async ({ page }) => {
    await page.goto("/pos");
    await expect(page).toHaveURL(/\/pos/i, { timeout: 10000 });

    // Scenario step: Select "Register New Product" or whichever appears first
    const firstScenario = page.getByRole("button").filter({ hasText: /Register|Stock In/i }).first();
    await expect(firstScenario).toBeVisible({ timeout: 15000 });
    await firstScenario.click();

    // After click, step moves to customer or product entry — NID input should appear
    await expect(
      page.getByPlaceholder(/National ID|NID|Serial/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Admin retailer management ────────────────────────────────────────────────

test.describe("Admin — Retailer Management", () => {
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

  test("Admin can view retailers list", async ({ page }) => {
    await page.goto("/admin/retailers");
    if (page.url().includes("/auth")) {
      test.skip();
      return;
    }
    await expect(
      page.getByRole("heading", { name: /Retailer|Retailers/i }).first()
    ).toBeVisible({ timeout: 15000 });
  });
});
