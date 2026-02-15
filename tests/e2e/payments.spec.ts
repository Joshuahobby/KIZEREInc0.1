import { test, expect } from "@playwright/test";

test.describe("API Health & Payments", () => {
    test("should return healthy from API health check", async ({ request }) => {
        const response = await request.get("/api/health");
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.status).toBe("ok");
        expect(body.database).toBe("connected");
    });

    test("should reject unauthenticated payment API access", async ({ request }) => {
        const response = await request.get("/api/payments");
        expect(response.status()).toBe(401);
    });

    test("should reject unauthenticated wallet access", async ({ request }) => {
        const response = await request.get("/api/payments/wallet");
        expect(response.status()).toBe(401);
    });
});
