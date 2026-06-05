import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerificationReportService } from "../verification-report.service";
import { storage } from "../../storage";

vi.mock("../../storage", () => ({
  storage: {
    getPayment: vi.fn(),
    getItemByUniqueIdentifier: vi.fn(),
    getPosProductBySerialWithRetailer: vi.fn(),
    getPosProductBySerial: vi.fn().mockResolvedValue(null),
    getUser: vi.fn(),
    createVerificationPurchase: vi.fn(),
    getActiveVerificationPurchase: vi.fn(),
  },
}));

const BASE_PAYMENT = {
  id: 1,
  userId: 10,
  type: "verification_report",
  metadata: { identifier: "IMEI-12345" },
};

const BASE_ITEM = {
  id: 5,
  userId: 10,
  name: "Samsung Galaxy S23",
  category: "Phones",
  uniqueIdentifier: "IMEI-12345",
  status: "Registered",
  registeredAt: new Date("2026-01-15"),
};

const BASE_USER = {
  id: 10,
  fullName: "Alice Uwase",
  email: "alice@example.com",
  phoneNumber: "+250788000000",
  premiumExpiresAt: null,
  premiumRegistrationCount: 0,
};

describe("VerificationReportService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("finalizeReport", () => {
    it("throws when payment is not found", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(null);
      await expect(VerificationReportService.finalizeReport(99))
        .rejects.toThrow("Verification report payment 99 not found");
    });

    it("throws when payment has no identifier in metadata", async () => {
      (storage.getPayment as any).mockResolvedValueOnce({ ...BASE_PAYMENT, metadata: {} });
      await expect(VerificationReportService.finalizeReport(1))
        .rejects.toThrow(/no identifier in metadata/);
    });

    it("creates a purchase with 48-hour expiry for a found item", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getItemByUniqueIdentifier as any).mockResolvedValueOnce(BASE_ITEM);
      (storage.getUser as any).mockResolvedValueOnce(BASE_USER);
      (storage.createVerificationPurchase as any).mockResolvedValueOnce({ id: 1 });

      const before = Date.now();
      await VerificationReportService.finalizeReport(1);
      const after = Date.now();

      expect(storage.createVerificationPurchase).toHaveBeenCalledTimes(1);
      const arg = (storage.createVerificationPurchase as any).mock.calls[0][0];
      expect(arg.userId).toBe(10);
      expect(arg.identifier).toBe("IMEI-12345");
      expect(arg.itemId).toBe(5);
      expect(arg.paymentId).toBe(1);

      const expiryMs = arg.expiresAt.getTime();
      const expected48h = 48 * 60 * 60 * 1000;
      expect(expiryMs - before).toBeGreaterThanOrEqual(expected48h - 1000);
      expect(expiryMs - after).toBeLessThanOrEqual(expected48h + 1000);
    });

    it("creates a purchase even when the item is not found (identifier unregistered)", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getItemByUniqueIdentifier as any).mockResolvedValueOnce(null);
      (storage.getPosProductBySerialWithRetailer as any).mockResolvedValueOnce(null);
      (storage.createVerificationPurchase as any).mockResolvedValueOnce({ id: 2 });

      await VerificationReportService.finalizeReport(1);

      const arg = (storage.createVerificationPurchase as any).mock.calls[0][0];
      expect(arg.itemId).toBeNull();
      const reportData = arg.reportData as any;
      expect(reportData.isRegistered).toBe(false);
    });
  });

  describe("getReport", () => {
    it("returns null when user is not found", async () => {
      (storage.getUser as any).mockResolvedValueOnce(null);
      const result = await VerificationReportService.getReport(99, "IMEI-12345");
      expect(result).toBeNull();
    });

    it("builds a full report on-the-fly for premium users (bypass pay-gate)", async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60);
      (storage.getUser as any).mockResolvedValueOnce({ ...BASE_USER, premiumExpiresAt: future });
      (storage.getItemByUniqueIdentifier as any).mockResolvedValueOnce(BASE_ITEM);
      (storage.getUser as any).mockResolvedValueOnce(BASE_USER); // for buildReport → owner lookup

      const report = await VerificationReportService.getReport(10, "IMEI-12345");

      expect(report).not.toBeNull();
      expect(report!.isRegistered).toBe(true);
      expect(report!.owner?.fullName).toBe("Alice Uwase");
      // Should NOT have called getActiveVerificationPurchase
      expect(storage.getActiveVerificationPurchase).not.toHaveBeenCalled();
    });

    it("returns null for non-premium user with no active purchase", async () => {
      (storage.getUser as any).mockResolvedValueOnce({ ...BASE_USER });
      (storage.getActiveVerificationPurchase as any).mockResolvedValueOnce(undefined);

      const result = await VerificationReportService.getReport(10, "IMEI-12345");
      expect(result).toBeNull();
    });

    it("returns stored reportData for non-premium user with active purchase", async () => {
      const storedReport = { isRegistered: true, identifier: "IMEI-12345", owner: { fullName: "Bob" } };
      (storage.getUser as any).mockResolvedValueOnce({ ...BASE_USER });
      (storage.getActiveVerificationPurchase as any).mockResolvedValueOnce({
        id: 7,
        reportData: storedReport,
      });
      // getReport appends isOwner from a POS product lookup after fetching the purchase
      (storage.getPosProductBySerial as any).mockResolvedValueOnce(null);

      const result = await VerificationReportService.getReport(10, "IMEI-12345");
      expect(result).toMatchObject(storedReport);
      expect((result as any).isOwner).toBe(false);
    });
  });

  describe("buildReport", () => {
    it("returns a not-registered report when item is null", async () => {
      const report = await VerificationReportService.buildReport(null, "UNKNOWN-123");
      expect(report.isRegistered).toBe(false);
      expect(report.owner).toBeNull();
    });

    it("marks isFlagged true for Lost items", async () => {
      (storage.getUser as any).mockResolvedValueOnce(BASE_USER);
      const report = await VerificationReportService.buildReport(
        { ...BASE_ITEM, status: "Lost" } as any,
        "IMEI-12345"
      );
      expect(report.isFlagged).toBe(true);
      expect(report.status).toBe("Lost");
    });

    it("includes owner fullName in the full report", async () => {
      (storage.getUser as any).mockResolvedValueOnce(BASE_USER);
      const report = await VerificationReportService.buildReport(BASE_ITEM as any, "IMEI-12345");
      expect(report.owner?.fullName).toBe("Alice Uwase");
    });
  });

  describe("buildFreeSummary", () => {
    it("returns not-registered summary for unknown identifier", async () => {
      (storage.getItemByUniqueIdentifier as any).mockResolvedValueOnce(null);
      (storage.getPosProductBySerialWithRetailer as any).mockResolvedValueOnce(null);
      const summary = await VerificationReportService.buildFreeSummary("UNKNOWN");
      expect(summary.isRegistered).toBe(false);
      expect(summary).not.toHaveProperty("owner");
    });

    it("returns registered summary without owner info", async () => {
      (storage.getItemByUniqueIdentifier as any).mockResolvedValueOnce(BASE_ITEM);
      const summary = await VerificationReportService.buildFreeSummary("IMEI-12345");
      expect(summary.isRegistered).toBe(true);
      expect(summary.category).toBe("Phones");
      expect(summary).not.toHaveProperty("owner");
    });
  });
});
