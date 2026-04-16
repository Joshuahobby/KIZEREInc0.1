import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConsumerSubscriptionService, FREE_TIER_REGISTRATION_LIMIT } from "../consumer-subscription.service";
import { storage } from "../../storage";

vi.mock("../../storage", () => ({
  storage: {
    getPayment: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const BASE_PAYMENT = {
  id: 1,
  userId: 10,
  type: "consumer_subscription",
  metadata: null,
};

const BASE_USER = {
  id: 10,
  role: "Subscriber",
  premiumExpiresAt: null,
  premiumRegistrationCount: 0,
};

describe("ConsumerSubscriptionService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("finalizeSubscription", () => {
    it("throws when payment is not found", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(null);
      await expect(ConsumerSubscriptionService.finalizeSubscription(99))
        .rejects.toThrow("Consumer subscription payment 99 not found");
    });

    it("throws when user is not found", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getUser as any).mockResolvedValueOnce(null);
      await expect(ConsumerSubscriptionService.finalizeSubscription(1))
        .rejects.toThrow(/User 10 not found/);
    });

    it("sets premiumExpiresAt ~1 year from now for a fresh subscription", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getUser as any).mockResolvedValueOnce({ ...BASE_USER });
      (storage.updateUser as any).mockResolvedValueOnce({});

      const before = Date.now();
      await ConsumerSubscriptionService.finalizeSubscription(1);
      const after = Date.now();

      const [, updates] = (storage.updateUser as any).mock.calls[0];
      const expiry: Date = updates.premiumExpiresAt;
      const msFromNow = expiry.getTime() - before;
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;

      expect(msFromNow).toBeGreaterThanOrEqual(oneYearMs - 5000);
      expect(msFromNow).toBeLessThanOrEqual(oneYearMs + (after - before) + 5000);
      expect(updates.premiumRegistrationCount).toBe(0);
    });

    it("stacks expiry when premium is still active (renewal)", async () => {
      const futureExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getUser as any).mockResolvedValueOnce({
        ...BASE_USER,
        premiumExpiresAt: futureExpiry,
      });
      (storage.updateUser as any).mockResolvedValueOnce({});

      await ConsumerSubscriptionService.finalizeSubscription(1);

      const [, updates] = (storage.updateUser as any).mock.calls[0];
      const expiry: Date = updates.premiumExpiresAt;
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      // expiry should be ~1 year beyond the existing futureExpiry
      expect(expiry.getTime()).toBeGreaterThan(futureExpiry.getTime() + oneYearMs - 5000);
    });
  });

  describe("isPremium", () => {
    it("returns false when premiumExpiresAt is null", () => {
      expect(ConsumerSubscriptionService.isPremium({ premiumExpiresAt: null })).toBe(false);
    });

    it("returns false when premiumExpiresAt is in the past", () => {
      const past = new Date(Date.now() - 1000);
      expect(ConsumerSubscriptionService.isPremium({ premiumExpiresAt: past })).toBe(false);
    });

    it("returns true when premiumExpiresAt is in the future", () => {
      const future = new Date(Date.now() + 1000 * 60 * 60);
      expect(ConsumerSubscriptionService.isPremium({ premiumExpiresAt: future })).toBe(true);
    });
  });

  describe("canRegisterItem", () => {
    it("always allows Admin users", async () => {
      (storage.getUser as any).mockResolvedValueOnce({ ...BASE_USER, role: "Admin" });
      const result = await ConsumerSubscriptionService.canRegisterItem(10);
      expect(result.allowed).toBe(true);
    });

    it("always allows premium subscribers regardless of count", async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60);
      (storage.getUser as any).mockResolvedValueOnce({
        ...BASE_USER,
        premiumExpiresAt: future,
        premiumRegistrationCount: 100,
      });
      const result = await ConsumerSubscriptionService.canRegisterItem(10);
      expect(result.allowed).toBe(true);
    });

    it("allows free-tier user below the limit", async () => {
      (storage.getUser as any).mockResolvedValueOnce({
        ...BASE_USER,
        premiumRegistrationCount: FREE_TIER_REGISTRATION_LIMIT - 1,
      });
      const result = await ConsumerSubscriptionService.canRegisterItem(10);
      expect(result.allowed).toBe(true);
    });

    it("blocks free-tier user at the limit", async () => {
      (storage.getUser as any).mockResolvedValueOnce({
        ...BASE_USER,
        premiumRegistrationCount: FREE_TIER_REGISTRATION_LIMIT,
      });
      const result = await ConsumerSubscriptionService.canRegisterItem(10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/Free accounts/);
    });

    it("returns not-allowed when user is not found", async () => {
      (storage.getUser as any).mockResolvedValueOnce(null);
      const result = await ConsumerSubscriptionService.canRegisterItem(99);
      expect(result.allowed).toBe(false);
    });
  });

  describe("incrementRegistrationCount", () => {
    it("increments the count for a free-tier user", async () => {
      (storage.getUser as any).mockResolvedValueOnce({ ...BASE_USER, premiumRegistrationCount: 1 });
      (storage.updateUser as any).mockResolvedValueOnce({});

      await ConsumerSubscriptionService.incrementRegistrationCount(10);

      const [, updates] = (storage.updateUser as any).mock.calls[0];
      expect(updates.premiumRegistrationCount).toBe(2);
    });

    it("does not increment for premium users", async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60);
      (storage.getUser as any).mockResolvedValueOnce({
        ...BASE_USER,
        premiumExpiresAt: future,
        premiumRegistrationCount: 2,
      });

      await ConsumerSubscriptionService.incrementRegistrationCount(10);
      expect(storage.updateUser).not.toHaveBeenCalled();
    });

    it("does not increment for Admin users", async () => {
      (storage.getUser as any).mockResolvedValueOnce({ ...BASE_USER, role: "Admin" });
      await ConsumerSubscriptionService.incrementRegistrationCount(10);
      expect(storage.updateUser).not.toHaveBeenCalled();
    });
  });
});
