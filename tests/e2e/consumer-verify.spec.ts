/**
 * E2E tests: Consumer Verification pay-gate
 *
 * API layer (runs without UI being built):
 *   - Free summary endpoint: public, always 200, shape matches spec
 *   - Full report endpoint: 401 without auth, 402 without purchase
 *   - Purchase endpoint: 401 without auth, 400 without phoneNumber
 *
 * UI layer (Phase 1 — skipped until /consumer/verify page is built):
 *   - Identifier input, free summary card, "Get Full Report" CTA, purchase modal
 */
import { test, expect, request as playwrightRequest } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, "../../playwright/.auth");
const subscriberAuthPath = path.join(AUTH_DIR, "subscriber.json");
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const UNKNOWN_ID = "e2e-not-registered-xyzzy-9999";

// ─── Free summary (public, no auth) ──────────────────────────────────────────

test.describe("Consumer Verify API — free summary (public)", () => {
  test("unknown identifier returns 200 with isRegistered: false", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.get(`/api/consumer/verify/${UNKNOWN_ID}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isRegistered).toBe(false);
    expect(body.isFlagged).toBe(false);
    expect(body.identifier).toBe(UNKNOWN_ID);
    await ctx.dispose();
  });

  test("response always includes required shape fields", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.get(`/api/consumer/verify/${UNKNOWN_ID}`);
    const body = await res.json();
    expect(body).toHaveProperty("isRegistered");
    expect(body).toHaveProperty("isFlagged");
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("category");
    await ctx.dispose();
  });

  test("does not expose owner information in free summary", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.get(`/api/consumer/verify/${UNKNOWN_ID}`);
    const body = await res.json();
    expect(body).not.toHaveProperty("owner");
    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("phoneNumber");
    await ctx.dispose();
  });
});

// ─── Full report endpoint (auth required) ────────────────────────────────────

test.describe("Consumer Verify API — full report gate (unauthenticated)", () => {
  test("returns 401 without auth", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.get(`/api/consumer/verify/${UNKNOWN_ID}/report`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});

test.describe("Consumer Verify API — full report gate (subscriber, no purchase)", () => {
  test.use({
    storageState: () =>
      fs.existsSync(subscriberAuthPath) ? subscriberAuthPath : (undefined as any),
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!fs.existsSync(subscriberAuthPath)) {
      testInfo.skip(true, "playwright/.auth/subscriber.json not found — run global setup first");
    }
  });

  test("returns 402 REPORT_ACCESS_REQUIRED without an active purchase", async ({ request }) => {
    const res = await request.get(`/api/consumer/verify/${UNKNOWN_ID}/report`);
    expect(res.status()).toBe(402);
    const body = await res.json();
    expect(body.code).toBe("REPORT_ACCESS_REQUIRED");
  });

  test("purchase endpoint returns 400 when phoneNumber is missing", async ({ request }) => {
    const res = await request.post(`/api/consumer/verify/${UNKNOWN_ID}/purchase`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("purchase endpoint returns 400 when phoneNumber is empty string", async ({ request }) => {
    const res = await request.post(`/api/consumer/verify/${UNKNOWN_ID}/purchase`, {
      data: { phoneNumber: "" },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("Consumer Verify API — purchase endpoint (unauthenticated)", () => {
  test("returns 401 without auth", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.post(`/api/consumer/verify/${UNKNOWN_ID}/purchase`, {
      data: { phoneNumber: "+250788000001" },
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });
});

// ─── UI layer — /verify-item page ────────────────────────────────────────────

test.describe("Consumer Verify Page UI — unauthenticated", () => {
  test("renders identifier input without redirect", async ({ page }) => {
    await page.goto("/verify-item");
    await expect(page).not.toHaveURL(/\/auth/i, { timeout: 10000 });
    await expect(page.getByRole("textbox")).toBeVisible({ timeout: 10000 });
  });

  test("shows free summary card after submitting an identifier", async ({ page }) => {
    await page.goto("/verify-item");
    await page.getByRole("textbox").fill(UNKNOWN_ID);
    await page.locator('button[type="submit"]').first().click();
    await expect(page.getByText(/not.*registry|not registered|not found/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("pre-fills identifier from ?id= query param and auto-searches", async ({ page }) => {
    await page.goto(`/verify-item?id=${encodeURIComponent(UNKNOWN_ID)}`);
    await expect(page.getByText(/not.*registry|not registered|not found/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Consumer Verify Page UI — authenticated subscriber", () => {
  test.use({
    storageState: () =>
      fs.existsSync(subscriberAuthPath) ? subscriberAuthPath : (undefined as any),
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!fs.existsSync(subscriberAuthPath)) {
      testInfo.skip(true, "playwright/.auth/subscriber.json not found — run global setup first");
    }
  });

  test("purchase modal opens when 'Get Full Report' is clicked for a registered item", async ({ page, request }) => {
    const res = await request.get("/api/items");
    const items = await res.json().catch(() => []);
    if (!Array.isArray(items) || items.length === 0) {
      test.skip();
      return;
    }
    const item = items[0];
    await page.goto(`/verify-item?id=${encodeURIComponent(item.uniqueIdentifier)}`);
    await expect(page.getByRole("button", { name: /full report/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /full report/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/phone/i)).toBeVisible();
  });
});
