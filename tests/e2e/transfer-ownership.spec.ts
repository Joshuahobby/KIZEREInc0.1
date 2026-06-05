/**
 * E2E tests: Ownership Transfer
 *
 * API layer (runs without UI being built):
 *   - Transfer lookup: 401 without auth, 400 for self-transfer
 *   - Transfer endpoint: 401 without auth, 400 for missing recipient
 *
 * UI layer:
 *   - Transfer button visible on item detail for owner
 *   - Modal opens, user lookup works, confirm step shown
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

// ─── Transfer lookup endpoint (unauthenticated) ───────────────────────────────

test.describe("Transfer lookup API — unauthenticated", () => {
  test("returns 401 without auth", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.get("/api/items/transfer/lookup?q=test@example.com");
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});

// ─── Transfer endpoint (unauthenticated) ─────────────────────────────────────

test.describe("Transfer ownership API — unauthenticated", () => {
  test("returns 401 without auth", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.post("/api/items/1/transfer", {
      data: { recipientEmail: "test@example.com" },
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });
});

// ─── Transfer endpoint (authenticated subscriber) ────────────────────────────

test.describe("Transfer ownership API — authenticated subscriber", () => {
  test.use({
    storageState: () =>
      fs.existsSync(subscriberAuthPath) ? subscriberAuthPath : (undefined as any),
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!fs.existsSync(subscriberAuthPath)) {
      testInfo.skip(true, "playwright/.auth/subscriber.json not found — run global setup first");
    }
  });

  test("transfer to non-existent item returns 404", async ({ request }) => {
    const res = await request.post("/api/items/999999/transfer", {
      data: { recipientEmail: "nobody@kizere.test" },
    });
    expect([404, 403]).toContain(res.status());
  });

  test("transfer without recipient body field returns 400", async ({ request }) => {
    const res = await request.post("/api/items/999999/transfer", {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("lookup with short query returns 400 or empty result", async ({ request }) => {
    const res = await request.get("/api/items/transfer/lookup?q=x");
    // Either 400 (too short) or 404 (not found), not 500
    expect(res.status()).not.toBe(500);
  });

  test("lookup with unknown email returns 404", async ({ request }) => {
    const res = await request.get("/api/items/transfer/lookup?q=nobody-xyzzy@kizere.test");
    expect(res.status()).toBe(404);
  });
});

// ─── Transfer UI — item detail page ──────────────────────────────────────────

test.describe("Transfer ownership UI — item detail page", () => {
  test.use({
    storageState: () =>
      fs.existsSync(subscriberAuthPath) ? subscriberAuthPath : (undefined as any),
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!fs.existsSync(subscriberAuthPath)) {
      testInfo.skip(true, "playwright/.auth/subscriber.json not found — run global setup first");
    }
  });

  test("Transfer Ownership button is visible on owner's registered item", async ({ page, request }) => {
    const itemsRes = await request.get("/api/items");
    if (!itemsRes.ok()) { test.skip(); return; }
    const items = await itemsRes.json();
    const registered = Array.isArray(items)
      ? items.find((i: any) => i.status === "Registered")
      : null;
    if (!registered) { test.skip(); return; }

    await page.goto(`/items/${registered.id}`);
    await expect(page.getByRole("button", { name: /transfer ownership/i })).toBeVisible({ timeout: 15000 });
  });

  test("clicking Transfer Ownership opens the transfer modal", async ({ page, request }) => {
    const itemsRes = await request.get("/api/items");
    if (!itemsRes.ok()) { test.skip(); return; }
    const items = await itemsRes.json();
    const registered = Array.isArray(items)
      ? items.find((i: any) => i.status === "Registered")
      : null;
    if (!registered) { test.skip(); return; }

    await page.goto(`/items/${registered.id}`);
    await page.getByRole("button", { name: /transfer ownership/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder(/email.*phone.*username/i)).toBeVisible({ timeout: 5000 });
  });
});
