import { describe, it, expect, vi, beforeEach } from "vitest";
import { isPosStubAccount, checkOrCreateCustomer, registerProduct, transferOwnership } from "../pos.service";
import { storage } from "../../storage";
import bcrypt from "bcrypt";
import { notifyPosCustomer } from "../pos-notification.service";

vi.mock("../../storage", () => ({
  storage: {
    getUserByNationalId: vi.fn(),
    createUser: vi.fn(),
    getRetailer: vi.fn(),
    countRetailerProducts: vi.fn(),
    getRetailerCustomerDetail: vi.fn(),
    getPosProductBySerial: vi.fn(),
    getGlobalStolenStatus: vi.fn(),
    createPosProduct: vi.fn(),
    createOwnershipLedgerEntry: vi.fn(),
    getPosProduct: vi.fn(),
    updatePosProduct: vi.fn(),
    createPosSecurityAlert: vi.fn(),
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

vi.mock("../../websocket", () => ({
  emitSecurityAlert: vi.fn(),
}));

vi.mock("../commission.service", () => ({
  CommissionService: {
    recordCommission: vi.fn().mockResolvedValue(undefined),
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
      (storage.getUserByNationalId as any).mockResolvedValueOnce(mockUser);

      const result = await checkOrCreateCustomer("123456", "John Doe");
      expect(result.isNew).toBe(false);
      expect(result.user).toEqual(mockUser);
    });

    it("creates a new stub user if not found", async () => {
      const mockNewUser = { id: 2, nationalId: "987654", email: "kz_987654_xyz@pos.kizere.local" };
      (storage.getUserByNationalId as any).mockResolvedValueOnce(undefined);
      (storage.createUser as any).mockResolvedValueOnce(mockNewUser);

      const result = await checkOrCreateCustomer("987654", "Jane Doe");
      expect(result.isNew).toBe(true);
      expect(result.user).toEqual(mockNewUser);
      expect(bcrypt.hash).toHaveBeenCalled();
    });
  });

  describe("registerProduct", () => {
    // retailer.userId=1, ownerId=2 → customerDetail check runs, notifyPosCustomer fires
    const mockRetailer = { id: 1, userId: 1, name: "Test Retailer", subscriptionPlan: "basic" };

    it("throws 409 if serial number already exists", async () => {
      (storage.getRetailer as any).mockResolvedValueOnce(mockRetailer);
      (storage.countRetailerProducts as any).mockResolvedValueOnce(0);
      (storage.getRetailerCustomerDetail as any).mockResolvedValueOnce(null);
      // Product exists at a different retailer → triggers the 409 branch
      (storage.getPosProductBySerial as any).mockResolvedValueOnce({
        id: 1,
        retailerId: 999,
        currentOwnerId: 999,
      });

      await expect(
        registerProduct({
          serialNumber: "SN123",
          name: "Test Product",
          retailerId: 1,
          ownerId: 2,
        })
      ).rejects.toThrow(/already exists/);
    });

    it("registers product and creates ledger entry", async () => {
      const mockProduct = { id: 10, name: "Test Product", serialNumber: "SN123", category: "Other" };
      const mockLedger = { id: 100, event: "sale" };

      (storage.getRetailer as any).mockResolvedValueOnce(mockRetailer);
      (storage.countRetailerProducts as any).mockResolvedValueOnce(0);
      (storage.getRetailerCustomerDetail as any).mockResolvedValueOnce(null);
      (storage.getPosProductBySerial as any).mockResolvedValueOnce(null);
      (storage.getGlobalStolenStatus as any).mockResolvedValueOnce({ isStolen: false });
      (storage.createPosProduct as any).mockResolvedValueOnce(mockProduct);
      (storage.createOwnershipLedgerEntry as any).mockResolvedValueOnce(mockLedger);

      const result = await registerProduct({
        serialNumber: "SN123",
        name: "Test Product",
        retailerId: 1,
        ownerId: 2,
      });

      expect(result.product).toEqual(mockProduct);
      expect(result.ledgerEntry).toEqual(mockLedger);
      expect(notifyPosCustomer).toHaveBeenCalledWith("registration", expect.any(Object));
    });
  });

  describe("transferOwnership", () => {
    it("throws 404 if product not found", async () => {
      (storage.getPosProduct as any).mockResolvedValueOnce(null);

      await expect(
        transferOwnership({
          productId: 99,
          newOwnerId: 3,
          retailerId: 1,
        })
      ).rejects.toThrow("Product not found");
    });

    it("throws if product is stolen", async () => {
      (storage.getPosProduct as any).mockResolvedValueOnce({ id: 99, status: "stolen" });

      await expect(
        transferOwnership({
          productId: 99,
          newOwnerId: 3,
          retailerId: 1,
        })
      ).rejects.toThrow("stolen");
    });
  });
});
