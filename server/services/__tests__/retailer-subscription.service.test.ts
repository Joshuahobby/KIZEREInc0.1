import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetailerSubscriptionService } from "../retailer-subscription.service";
import { storage } from "../../storage";

vi.mock("../../storage", () => ({
  storage: {
    getPayment: vi.fn(),
    getRetailer: vi.fn(),
    updateRetailer: vi.fn(),
  },
}));

const BASE_PAYMENT = {
  id: 1,
  posRetailerId: 10,
  amount: "5000",
  metadata: null,
};

const BASE_RETAILER = {
  id: 10,
  subscriptionPlan: "standard",
  subscriptionExpiresAt: null,
  subscriptionPaidAt: null,
};

describe("RetailerSubscriptionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("finalizeSubscription", () => {
    it("throws when payment is not found", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(null);
      await expect(RetailerSubscriptionService.finalizeSubscription(99))
        .rejects.toThrow("Subscription payment 99 not found");
    });

    it("throws when payment has no retailer context", async () => {
      (storage.getPayment as any).mockResolvedValueOnce({
        ...BASE_PAYMENT,
        posRetailerId: null,
        metadata: null,
      });
      await expect(RetailerSubscriptionService.finalizeSubscription(1))
        .rejects.toThrow(/no associated retailer/);
    });

    it("throws when retailer is not found", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getRetailer as any).mockResolvedValueOnce(null);
      await expect(RetailerSubscriptionService.finalizeSubscription(1))
        .rejects.toThrow("Retailer 10 not found");
    });

    it("sets expiry ~1 year from now when retailer has no prior subscription", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getRetailer as any).mockResolvedValueOnce(BASE_RETAILER);
      (storage.updateRetailer as any).mockResolvedValueOnce({});

      const before = Date.now();
      await RetailerSubscriptionService.finalizeSubscription(1);
      const after = Date.now();

      const call = (storage.updateRetailer as any).mock.calls[0];
      const newExpiry: Date = call[1].subscriptionExpiresAt;
      const oneYear = 365 * 24 * 60 * 60 * 1000;

      // Should be roughly now + 1 year
      expect(newExpiry.getTime()).toBeGreaterThanOrEqual(before + oneYear - 1000);
      expect(newExpiry.getTime()).toBeLessThanOrEqual(after + oneYear + 1000);
    });

    it("stacks renewal from existing future expiry (not today)", async () => {
      const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getRetailer as any).mockResolvedValueOnce({
        ...BASE_RETAILER,
        subscriptionExpiresAt: futureExpiry,
      });
      (storage.updateRetailer as any).mockResolvedValueOnce({});

      await RetailerSubscriptionService.finalizeSubscription(1);

      const call = (storage.updateRetailer as any).mock.calls[0];
      const newExpiry: Date = call[1].subscriptionExpiresAt;
      const oneYear = 365 * 24 * 60 * 60 * 1000;

      // Should be ~futureExpiry + 1 year
      expect(newExpiry.getTime()).toBeCloseTo(futureExpiry.getTime() + oneYear, -3);
    });

    it("resolves retailerId from metadata when posRetailerId is null", async () => {
      (storage.getPayment as any).mockResolvedValueOnce({
        ...BASE_PAYMENT,
        posRetailerId: null,
        metadata: { retailerId: 42 },
      });
      (storage.getRetailer as any).mockResolvedValueOnce({ ...BASE_RETAILER, id: 42 });
      (storage.updateRetailer as any).mockResolvedValueOnce({});

      await RetailerSubscriptionService.finalizeSubscription(1);

      expect(storage.getRetailer).toHaveBeenCalledWith(42);
    });
  });

  describe("isSubscriptionActive", () => {
    it("always returns true for basic plan regardless of expiry", () => {
      expect(RetailerSubscriptionService.isSubscriptionActive({
        subscriptionPlan: "basic",
        subscriptionExpiresAt: null,
      })).toBe(true);

      expect(RetailerSubscriptionService.isSubscriptionActive({
        subscriptionPlan: "basic",
        subscriptionExpiresAt: new Date(Date.now() - 1000), // expired
      })).toBe(true);
    });

    it("returns false for non-basic plan with no expiry set", () => {
      expect(RetailerSubscriptionService.isSubscriptionActive({
        subscriptionPlan: "standard",
        subscriptionExpiresAt: null,
      })).toBe(false);
    });

    it("returns false for non-basic plan with past expiry", () => {
      expect(RetailerSubscriptionService.isSubscriptionActive({
        subscriptionPlan: "premium",
        subscriptionExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })).toBe(false);
    });

    it("returns true for non-basic plan with future expiry", () => {
      expect(RetailerSubscriptionService.isSubscriptionActive({
        subscriptionPlan: "enterprise",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })).toBe(true);
    });
  });
});
