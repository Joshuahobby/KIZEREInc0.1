import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommissionService } from "../commission.service";
import { db } from "../../db";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
}));

vi.mock("../../utils/pawapay", () => ({
  initiatePayout: vi.fn(),
  generateDepositId: vi.fn().mockReturnValue("deposit-uuid-123"),
}));

describe("CommissionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordCommission — commission amount calculation", () => {
    // transactionValue is now KIZERE's collected fee (e.g. 500 RWF registration fee),
    // NOT the product sale price. Commission = kizereFeee × commissionRate.
    it("calculates 20% commission on 500 RWF KIZERE registration fee (= 100 RWF to retailer)", async () => {
      (db.where as any).mockResolvedValueOnce([{ commissionRate: "0.20" }]);
      const mockCommission = {
        id: 1, retailerId: 10, ledgerEntryId: 5,
        transactionValue: "500", commissionAmount: "100",
        currency: "RWF", status: "pending",
      };
      (db.returning as any).mockResolvedValueOnce([mockCommission]);

      const result = await CommissionService.recordCommission(5, 10, 500);

      expect(result).toEqual(mockCommission);
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        commissionAmount: "100",   // floor(500 * 0.20) — KIZERE keeps 400 RWF
        transactionValue: "500",
        status: "pending",
        currency: "RWF",
      }));
    });

    it("calculates 10% commission on 300 RWF KIZERE transfer fee (= 30 RWF to retailer)", async () => {
      (db.where as any).mockResolvedValueOnce([{ commissionRate: "0.10" }]);
      const mockCommission = {
        id: 2, retailerId: 11, ledgerEntryId: 6,
        transactionValue: "300", commissionAmount: "30",
        currency: "RWF", status: "pending",
      };
      (db.returning as any).mockResolvedValueOnce([mockCommission]);

      const result = await CommissionService.recordCommission(6, 11, 300);

      expect(result.commissionAmount).toBe("30");
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        commissionAmount: "30",   // floor(300 * 0.10)
      }));
    });

    it("floors fractional commission amounts", async () => {
      (db.where as any).mockResolvedValueOnce([{ commissionRate: "0.20" }]);
      const mockCommission = { id: 3, commissionAmount: "149", commissionRate: "0.20" };
      (db.returning as any).mockResolvedValueOnce([mockCommission]);

      await CommissionService.recordCommission(7, 12, 749);

      // floor(749 * 0.20) = floor(149.8) = 149
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        commissionAmount: "149",
      }));
    });

    it("throws if retailer is not found", async () => {
      (db.where as any).mockResolvedValueOnce([]); // no retailer
      await expect(CommissionService.recordCommission(1, 999, 10000))
        .rejects.toThrow("Retailer 999 not found");
    });
  });

  describe("queuePayout", () => {
    it("throws if commission is already processed", async () => {
      (db.where as any).mockResolvedValueOnce([{ id: 1, status: "processing", retailerId: 1, commissionAmount: "500" }]);
      await expect(CommissionService.queuePayout(1, 1))
        .rejects.toThrow("Commission is already processing");
    });

    it("throws if retailer has no wallet phone", async () => {
      (db.where as any)
        .mockResolvedValueOnce([{ id: 1, status: "pending", retailerId: 1, commissionAmount: "500", payoutDestination: null }])
        .mockResolvedValueOnce([{ walletPhone: null }]);
      await expect(CommissionService.queuePayout(1, 1))
        .rejects.toThrow("no wallet phone");
    });
  });
});
