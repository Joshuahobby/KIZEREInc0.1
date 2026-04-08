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
    it("calculates 5% commission (default rate) and inserts a record", async () => {
      // Retailer with default 5% commission rate
      (db.where as any).mockResolvedValueOnce([{ commissionRate: "0.05" }]);
      const mockCommission = {
        id: 1, retailerId: 10, ledgerEntryId: 5,
        transactionValue: "100000", commissionAmount: "5000",
        currency: "RWF", status: "pending",
      };
      (db.returning as any).mockResolvedValueOnce([mockCommission]);

      const result = await CommissionService.recordCommission(5, 10, 100000);

      expect(result).toEqual(mockCommission);
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        commissionAmount: "5000",   // floor(100000 * 0.05)
        transactionValue: "100000",
        status: "pending",
        currency: "RWF",
      }));
    });

    it("calculates 10% commission for a retailer with custom rate", async () => {
      (db.where as any).mockResolvedValueOnce([{ commissionRate: "0.10" }]);
      const mockCommission = {
        id: 2, retailerId: 11, ledgerEntryId: 6,
        transactionValue: "50000", commissionAmount: "5000",
        currency: "RWF", status: "pending",
      };
      (db.returning as any).mockResolvedValueOnce([mockCommission]);

      const result = await CommissionService.recordCommission(6, 11, 50000);

      expect(result.commissionAmount).toBe("5000");
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        commissionAmount: "5000",   // floor(50000 * 0.10)
      }));
    });

    it("floors fractional commission amounts", async () => {
      (db.where as any).mockResolvedValueOnce([{ commissionRate: "0.05" }]);
      const mockCommission = { id: 3, commissionAmount: "4999", commissionRate: "0.05" };
      (db.returning as any).mockResolvedValueOnce([mockCommission]);

      await CommissionService.recordCommission(7, 12, 99990);

      // floor(99990 * 0.05) = floor(4999.5) = 4999
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        commissionAmount: "4999",
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
      await expect(CommissionService.queuePayout(1))
        .rejects.toThrow("Commission is already processing");
    });

    it("throws if retailer has no wallet phone", async () => {
      (db.where as any)
        .mockResolvedValueOnce([{ id: 1, status: "pending", retailerId: 1, commissionAmount: "500", payoutDestination: null }])
        .mockResolvedValueOnce([{ walletPhone: null }]);
      await expect(CommissionService.queuePayout(1))
        .rejects.toThrow("no wallet phone");
    });
  });
});
