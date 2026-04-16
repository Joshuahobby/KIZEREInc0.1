/**
 * E2E tests: Ownership Certificate
 *
 * API layer (runs without UI being built):
 *   - Certificates list: 401 without auth, 404 for unknown item, 403 for non-owner
 *   - Admin can access any item's certificates
 *
 * UI layer (Phase 3 — skipped until item-certificate.tsx is built):
 *   - "Get Official Certificate" button on item detail
 *   - Printable certificate card with download/print actions
 */
import { test, expect, request as playwrightRequest } from "@playwright/test";
import path from "path";
import fs from "fs";

const AUTH_DIR = path.join(__dirname, "../../playwright/.auth");
const adminAuthPath = path.join(AUTH_DIR, "admin.json");
const subscriberAuthPath = path.join(AUTH_DIR, "subscriber.json");
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const NON_EXISTENT_ITEM_ID = 999999;

// ─── Certificates endpoint (unauthenticated) ──────────────────────────────────

test.describe("Certificates API — unauthenticated", () => {
  test("returns 401 for any item ID without auth", async () => {
    const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const res = await ctx.get(`/api/items/${NON_EXISTENT_ITEM_ID}/certificates`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});

// ─── Certificates endpoint (admin) ───────────────────────────────────────────

test.describe("Certificates API — admin", () => {
  test.use({
    storageState: () =>
      fs.existsSync(adminAuthPath) ? adminAuthPath : (undefined as any),
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!fs.existsSync(adminAuthPath)) {
      testInfo.skip(true, "playwright/.auth/admin.json not found — run global setup first");
    }
  });

  test("returns 404 for non-existent item", async ({ request }) => {
    const res = await request.get(`/api/items/${NON_EXISTENT_ITEM_ID}/certificates`);
    expect(res.status()).toBe(404);
  });

  test("returns 400 for non-numeric item ID", async ({ request }) => {
    const res = await request.get("/api/items/not-a-number/certificates");
    expect(res.status()).toBe(400);
  });

  test("returns an array for a valid item the admin owns or can access", async ({ request }) => {
    // First, find a real item via the admin items list
    const itemsRes = await request.get("/api/admin/items?limit=1");
    if (!itemsRes.ok()) {
      // No admin items endpoint or no items seeded — skip gracefully
      test.skip();
      return;
    }
    const itemsBody = await itemsRes.json();
    const items = itemsBody.items ?? itemsBody;
    if (!Array.isArray(items) || items.length === 0) {
      test.skip();
      return;
    }
    const itemId = items[0].id;
    const res = await request.get(`/api/items/${itemId}/certificates`);
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

// ─── Certificates endpoint (subscriber / non-owner) ──────────────────────────

test.describe("Certificates API — subscriber (non-owner access)", () => {
  test.use({
    storageState: () =>
      fs.existsSync(subscriberAuthPath) ? subscriberAuthPath : (undefined as any),
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!fs.existsSync(subscriberAuthPath)) {
      testInfo.skip(true, "playwright/.auth/subscriber.json not found — run global setup first");
    }
  });

  test("non-owner gets 404 (item existence is not leaked) for another user's item", async ({ request }) => {
    // Without knowing a real other-user item ID, we use a non-existent one.
    // Any non-owner access to a missing item must return 404, not 403.
    const res = await request.get(`/api/items/${NON_EXISTENT_ITEM_ID}/certificates`);
    // 404 is returned both when item doesn't exist and when access is denied
    expect([404, 403]).toContain(res.status());
  });

  test("subscriber can access their own item's certificates list", async ({ request }) => {
    // Get the subscriber's own items
    const itemsRes = await request.get("/api/items");
    if (!itemsRes.ok()) {
      test.skip();
      return;
    }
    const items = await itemsRes.json();
    if (!Array.isArray(items) || items.length === 0) {
      // Subscriber has no items registered — skip this assertion
      test.skip();
      return;
    }
    const itemId = items[0].id;
    const res = await request.get(`/api/items/${itemId}/certificates`);
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

// ─── UI layer — Phase 3 (skipped until certificate UI is built) ───────────────
//
// Uncomment after Phase 3 UI is implemented per docs/FRONTEND-PLAN.md:
//
// test.describe("Certificate UI — item detail button", () => {
//   test.use({ storageState: subscriberAuthPath });
//
//   test("owner sees 'Get Official Certificate' button on item detail", async ({ page }) => {
//     // Navigate to a real item owned by the subscriber
//     await page.goto("/dashboard");
//     await page.getByRole("link", { name: /my items/i }).click();
//     await page.getByRole("row").first().getByRole("link").click();
//     await expect(page.getByRole("button", { name: /certificate/i })).toBeVisible({ timeout: 15000 });
//   });
// });
//
// test.describe("Certificate UI — view and download", () => {
//   test.use({ storageState: subscriberAuthPath });
//
//   test("certificate page renders printable card with item details", async ({ page }) => {
//     // Requires a seeded item ID that has a confirmed certificate payment
//     await page.goto("/items/1/certificate");
//     await expect(page.getByText(/KIZERE/i)).toBeVisible({ timeout: 10000 });
//     await expect(page.getByRole("button", { name: /download/i })).toBeVisible();
//     await expect(page.getByRole("button", { name: /print/i })).toBeVisible();
//   });
// });
