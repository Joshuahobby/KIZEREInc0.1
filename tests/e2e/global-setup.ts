import { chromium, request as playwrightRequest, FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const AUTH_DIR = path.join(process.cwd(), "playwright/.auth");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";

const TEST_RETAILER_USERNAME = "e2e_retailer_test";
const TEST_RETAILER_EMAIL = "e2e-retailer@test.kizere.local";
const TEST_RETAILER_PASSWORD = "E2eRetailer123!";

const TEST_SUBSCRIBER_USERNAME = "e2e_subscriber_test";
const TEST_SUBSCRIBER_EMAIL = "e2e-subscriber@test.kizere.local";
const TEST_SUBSCRIBER_PASSWORD = "E2eSubscriber123!";

/**
 * Global setup runs once before all Playwright tests.
 * It seeds:
 *   - playwright/.auth/admin.json     (admin session)
 *   - playwright/.auth/retailer.json  (retailer session)
 *
 * Strategy:
 * 1. Login as admin via API (admin account is seeded with twoFactorEnabled=false)
 * 2. Create a test Retailer user via admin API (twoFactorEnabled=false so no OTP needed)
 * 3. Login as retailer → onboard → save storage state
 */
export default async function globalSetup(_config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });

  // ──────────────────────────────────────────────
  // Step 1: Get CSRF token and login as admin
  // ──────────────────────────────────────────────
  const csrfRes = await ctx.get("/api/csrf-token");
  const csrfData = await csrfRes.json().catch(() => ({}));
  const csrfToken = csrfData.csrfToken || "";

  const adminLoginRes = await ctx.post("/api/auth/login", {
    data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    headers: { "x-csrf-token": csrfToken },
  });

  if (!adminLoginRes.ok()) {
    const body = await adminLoginRes.text();
    console.warn(`[global-setup] Admin login failed (${adminLoginRes.status()}): ${body}`);
    console.warn("[global-setup] Skipping auth seeding — retailer tests will be skipped.");
    return;
  }

  const adminData = await adminLoginRes.json();
  if (adminData.requires2FA) {
    console.warn("[global-setup] Admin account requires 2FA — cannot seed auth state automatically.");
    console.warn("[global-setup] Retailer E2E tests will be skipped.");
    return;
  }

  console.log("[global-setup] Admin logged in successfully.");

  // Save admin storage state via browser (needed for cookie-based auth)
  const browser = await chromium.launch();
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();

  await adminPage.goto(`${BASE_URL}/auth`);
  await adminPage.fill('input[name="username"]', ADMIN_USERNAME);
  await adminPage.fill('input[name="password"]', ADMIN_PASSWORD);
  await adminPage.locator("form").first().locator('button[type="submit"]').click();

  try {
    await adminPage.waitForURL(/\/(dashboard|admin)/i, { timeout: 15000 });
    await adminCtx.storageState({ path: path.join(AUTH_DIR, "admin.json") });
    console.log("[global-setup] Admin storage state saved.");
  } catch {
    console.warn("[global-setup] Admin browser login did not reach dashboard (likely 2FA). admin.json not saved.");
  }

  // ──────────────────────────────────────────────
  // Step 2: Create test retailer user via admin API
  // ──────────────────────────────────────────────
  const newCsrfRes = await ctx.get("/api/csrf-token");
  const newCsrfToken = (await newCsrfRes.json().catch(() => ({}))).csrfToken || "";

  const createUserRes = await ctx.post("/api/admin/users", {
    data: {
      fullName: "E2E Test Retailer",
      username: TEST_RETAILER_USERNAME,
      email: TEST_RETAILER_EMAIL,
      password: TEST_RETAILER_PASSWORD,
      role: "Subscriber",
      status: "active",
      verificationStatus: "approved",
      twoFactorEnabled: false,
    },
    headers: { "x-csrf-token": newCsrfToken },
  });

  if (!createUserRes.ok()) {
    const body = await createUserRes.text();
    // 400 "Username already exists" is fine — user was seeded previously
    if (!body.includes("already exists")) {
      console.warn(`[global-setup] Could not create test retailer user: ${body}`);
    }
  } else {
    console.log("[global-setup] Test retailer user created.");
  }

  // ──────────────────────────────────────────────
  // Step 3: Login as retailer and onboard
  // ──────────────────────────────────────────────
  const retailerCtx = await browser.newContext();
  const retailerPage = await retailerCtx.newPage();

  await retailerPage.goto(`${BASE_URL}/auth`);
  await retailerPage.fill('input[name="username"]', TEST_RETAILER_USERNAME);
  await retailerPage.fill('input[name="password"]', TEST_RETAILER_PASSWORD);
  await retailerPage.locator("form").first().locator('button[type="submit"]').click();

  try {
    await retailerPage.waitForURL(/\/(dashboard|retailer|pos)/i, { timeout: 20000 });
    console.log("[global-setup] Retailer logged in, URL:", retailerPage.url());

    // Onboard as retailer if not already done
    if (!retailerPage.url().includes("/retailer")) {
      const onboardCsrfRes = await retailerCtx.request.get(`${BASE_URL}/api/csrf-token`);
      const onboardCsrf = (await onboardCsrfRes.json().catch(() => ({}))).csrfToken || "";

      const onboardRes = await retailerCtx.request.post(`${BASE_URL}/api/pos/onboard`, {
        data: {
          name: "E2E Test Store",
          email: TEST_RETAILER_EMAIL,
          phone: "+250788000001",
          address: "KG 7 Ave, Kigali",
        },
        headers: { "x-csrf-token": onboardCsrf },
      });

      if (onboardRes.ok()) {
        console.log("[global-setup] Retailer onboarding complete.");
      } else {
        const body = await onboardRes.text();
        if (!body.includes("already have a retailer")) {
          console.warn(`[global-setup] Onboarding warning: ${body}`);
        }
      }
    }

    await retailerCtx.storageState({ path: path.join(AUTH_DIR, "retailer.json") });
    console.log("[global-setup] Retailer storage state saved.");
  } catch (err: any) {
    console.warn(`[global-setup] Retailer browser login failed: ${err.message}`);
    console.warn("[global-setup] retailer.json not saved — retailer tests will be skipped.");
  }

  // ──────────────────────────────────────────────
  // Step 4: Create test subscriber user via admin API
  // ──────────────────────────────────────────────
  const subCsrfRes = await ctx.get("/api/csrf-token");
  const subCsrfToken = (await subCsrfRes.json().catch(() => ({}))).csrfToken || "";

  const createSubscriberRes = await ctx.post("/api/admin/users", {
    data: {
      fullName: "E2E Test Subscriber",
      username: TEST_SUBSCRIBER_USERNAME,
      email: TEST_SUBSCRIBER_EMAIL,
      password: TEST_SUBSCRIBER_PASSWORD,
      role: "Subscriber",
      status: "active",
      verificationStatus: "approved",
      twoFactorEnabled: false,
    },
    headers: { "x-csrf-token": subCsrfToken },
  });

  if (!createSubscriberRes.ok()) {
    const body = await createSubscriberRes.text();
    if (!body.includes("already exists")) {
      console.warn(`[global-setup] Could not create test subscriber user: ${body}`);
    }
  } else {
    console.log("[global-setup] Test subscriber user created.");
  }

  // ──────────────────────────────────────────────
  // Step 5: Login as subscriber and save state
  // ──────────────────────────────────────────────
  const subscriberCtx = await browser.newContext();
  const subscriberPage = await subscriberCtx.newPage();

  await subscriberPage.goto(`${BASE_URL}/auth`);
  await subscriberPage.fill('input[name="username"]', TEST_SUBSCRIBER_USERNAME);
  await subscriberPage.fill('input[name="password"]', TEST_SUBSCRIBER_PASSWORD);
  await subscriberPage.locator("form").first().locator('button[type="submit"]').click();

  try {
    await subscriberPage.waitForURL(/\/(dashboard|home|verify)/i, { timeout: 15000 });
    await subscriberCtx.storageState({ path: path.join(AUTH_DIR, "subscriber.json") });
    console.log("[global-setup] Subscriber storage state saved.");
  } catch (err: any) {
    console.warn(`[global-setup] Subscriber browser login failed: ${err.message}`);
    console.warn("[global-setup] subscriber.json not saved — subscriber tests will be skipped.");
  }

  await browser.close();
  await ctx.dispose();
}
