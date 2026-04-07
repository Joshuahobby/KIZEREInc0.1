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
