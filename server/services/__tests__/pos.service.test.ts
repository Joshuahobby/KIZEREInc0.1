import { describe, it, expect, vi, beforeEach } from "vitest";
import { isPosStubAccount, checkOrCreateCustomer, registerProduct, transferOwnership } from "../pos.service";
import { db } from "../../db";
import bcrypt from "bcrypt";
import { notifyPosCustomer } from "../pos-notification.service";

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
    query: {
      retailers: {
        findFirst: vi.fn(),
      }
    }
  },
}));

vi.mock("../pos-notification.service", () => ({
  notifyPosCustomer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}));

describe("POS Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isPosStubAccount", () => {
    it("returns true for a pos.kizere.local email", () => {
      expect(isPosStubAccount("test@pos.kizere.local")).toBe(true);
    });

    it("returns false for a normal email", () => {
      expect(isPosStubAccount("test@gmail.com")).toBe(false);
    });

    it("returns false for null or undefined", () => {
      expect(isPosStubAccount(null)).toBe(false);
      expect(isPosStubAccount(undefined)).toBe(false);
    });
  });

  describe("checkOrCreateCustomer", () => {
    it("returns existing user if found", async () => {
      const mockUser = { id: 1, nationalId: "123456" };
      (db.limit as any).mockResolvedValueOnce([mockUser]);

      const result = await checkOrCreateCustomer("123456", "John Doe");
      expect(result.isNew).toBe(false);
      expect(result.user).toEqual(mockUser);
    });

    it("creates a new stub user if not found", async () => {
      (db.limit as any).mockResolvedValueOnce([]); // No existing user
      const mockNewUser = { id: 2, nationalId: "987654", email: "kz_87654_xyz@pos.kizere.local" };
      (db.returning as any).mockResolvedValueOnce([mockNewUser]);

      const result = await checkOrCreateCustomer("987654", "Jane Doe");
      expect(result.isNew).toBe(true);
      expect(result.user).toEqual(mockNewUser);
      expect(bcrypt.hash).toHaveBeenCalled();
    });
  });

  describe("registerProduct", () => {
    it("throws 409 if serial number already exists", async () => {
      (db.limit as any).mockResolvedValueOnce([{ id: 1 }]); // Duplicate found
      
      await expect(registerProduct({
        serialNumber: "SN123",
        name: "Test Product",
        retailerId: 1,
        ownerId: 2
      })).rejects.toThrow(/already exists/);
    });

    it("registers product and creates ledger entry", async () => {
      (db.limit as any).mockResolvedValueOnce([]); // No duplicate
      const mockProduct = { id: 10, name: "Test Product", serialNumber: "SN123" };
      const mockLedger = { id: 100, event: "sale" };
      
      (db.returning as any)
        .mockResolvedValueOnce([mockProduct]) // Product insert
        .mockResolvedValueOnce([mockLedger]); // Ledger insert
      
      (db.query.retailers.findFirst as any).mockResolvedValueOnce({ id: 1, name: "Test Retailer" });

      const result = await registerProduct({
        serialNumber: "SN123",
        name: "Test Product",
        retailerId: 1,
        ownerId: 2
      });

      expect(result.product).toEqual(mockProduct);
      expect(result.ledgerEntry).toEqual(mockLedger);
      expect(notifyPosCustomer).toHaveBeenCalledWith("registration", expect.any(Object));
    });
  });

  describe("transferOwnership", () => {
    it("throws 404 if product not found", async () => {
      (db.limit as any).mockResolvedValueOnce([]);
      
      await expect(transferOwnership({
        productId: 99,
        newOwnerId: 3,
        retailerId: 1
      })).rejects.toThrow("Product not found");
    });

    it("throws 400 if product is stolen", async () => {
      (db.limit as any).mockResolvedValueOnce([{ id: 99, status: "stolen" }]);
      
      await expect(transferOwnership({
        productId: 99,
        newOwnerId: 3,
        retailerId: 1
      })).rejects.toThrow("stolen");
    });
  });
});
