import { describe, it, expect, vi, beforeEach } from "vitest";
import { CertificateService } from "../certificate.service";
import { storage } from "../../storage";
import { QRCodeService } from "../qrcode.service";

vi.mock("../../storage", () => ({
  storage: {
    getPayment: vi.fn(),
    getItem: vi.fn(),
    getUser: vi.fn(), // used by sendCertificateEmail (fire-and-forget)
    getOwnershipCertificatesByItem: vi.fn(),
    createOwnershipCertificate: vi.fn(),
  },
}));

// QRCodeService generates a data URL — stub it to avoid canvas/browser deps
vi.mock("../qrcode.service", () => ({
  QRCodeService: {
    generateDataURL: vi.fn().mockResolvedValue("data:image/png;base64,FAKE"),
  },
}));

const BASE_PAYMENT = {
  id: 1,
  userId: 10,
  itemId: 5,
  posRetailerId: null,
  metadata: null,
};

const BASE_ITEM = {
  id: 5,
  name: "Samsung Galaxy S23",
  category: "Phones",
  uniqueIdentifier: "123456789012345",
};

const BASE_CERT = {
  id: 1,
  itemId: 5,
  userId: 10,
  paymentId: 1,
  certificateCode: "KZRC-AABBCC112233",
  issuedAt: new Date("2026-04-16"),
  metadata: {},
};

describe("CertificateService", () => {
  beforeEach(() => {
    // resetAllMocks flushes mockResolvedValueOnce queues so early-exit tests
    // cannot leak unconsumed mock values into the next test.
    vi.resetAllMocks();
    // Restore the QRCode stub (resetAllMocks wipes it)
    (QRCodeService.generateDataURL as any).mockResolvedValue("data:image/png;base64,FAKE");
  });

  describe("finalizeIssuance", () => {
    it("throws when payment is not found", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(null);
      await expect(CertificateService.finalizeIssuance(99))
        .rejects.toThrow("Certificate payment 99 not found");
    });

    it("throws when payment has no itemId and no metadata.itemId", async () => {
      (storage.getPayment as any).mockResolvedValueOnce({ ...BASE_PAYMENT, itemId: null, metadata: null });
      await expect(CertificateService.finalizeIssuance(1))
        .rejects.toThrow(/no associated item/);
    });

    it("throws when item is not found", async () => {
      // Service throws after getItem — getOwnershipCertificatesByItem is never reached
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getItem as any).mockResolvedValueOnce(null);
      await expect(CertificateService.finalizeIssuance(1))
        .rejects.toThrow("Item 5 not found");
    });

    it("resolves itemId from metadata when itemId is null on payment", async () => {
      (storage.getPayment as any).mockResolvedValueOnce({
        ...BASE_PAYMENT,
        itemId: null,
        metadata: { itemId: 99 },
      });
      (storage.getOwnershipCertificatesByItem as any).mockResolvedValueOnce([]);
      (storage.getItem as any).mockResolvedValueOnce({ ...BASE_ITEM, id: 99 });
      (storage.createOwnershipCertificate as any).mockResolvedValueOnce({
        ...BASE_CERT,
        itemId: 99,
        certificateCode: "KZRC-NEWCODE",
      });

      await CertificateService.finalizeIssuance(1);
      expect(storage.getItem).toHaveBeenCalledWith(99);
    });

    it("returns existing certificate when one already exists for the same payment (idempotent)", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getOwnershipCertificatesByItem as any).mockResolvedValueOnce([BASE_CERT]);
      (storage.getItem as any).mockResolvedValueOnce(BASE_ITEM);

      const result = await CertificateService.finalizeIssuance(1);

      expect(result).toEqual(BASE_CERT);
      expect(storage.createOwnershipCertificate).not.toHaveBeenCalled();
    });

    it("creates a new certificate with a KZRC- prefixed code", async () => {
      (storage.getPayment as any).mockResolvedValueOnce(BASE_PAYMENT);
      (storage.getOwnershipCertificatesByItem as any).mockResolvedValueOnce([]);
      (storage.getItem as any).mockResolvedValueOnce(BASE_ITEM);
      (storage.createOwnershipCertificate as any).mockImplementationOnce(async (data: any) => ({
        ...data,
        id: 99,
        issuedAt: new Date(),
      }));

      const result = await CertificateService.finalizeIssuance(1);

      expect(storage.createOwnershipCertificate).toHaveBeenCalledTimes(1);
      const callArg = (storage.createOwnershipCertificate as any).mock.calls[0][0];
      expect(callArg.certificateCode).toMatch(/^KZRC-[A-F0-9]{12}$/);
      expect(callArg.itemId).toBe(5);
      expect(callArg.userId).toBe(10);
      expect(callArg.paymentId).toBe(1);
    });
  });

  describe("generateHtml", () => {
    it("produces HTML containing the certificate code and item name", async () => {
      const html = await CertificateService.generateHtml(
        BASE_CERT as any,
        BASE_ITEM as any,
        { id: 10, fullName: "Alice Uwase", username: "alice", email: "alice@example.com" } as any
      );
      expect(html).toContain("KZRC-AABBCC112233");
      expect(html).toContain("Samsung Galaxy S23");
      expect(html).toContain("Alice Uwase");
      expect(html).toContain("Phones");
    });

    it("contains a QR code img tag with a data URL", async () => {
      const html = await CertificateService.generateHtml(
        BASE_CERT as any,
        BASE_ITEM as any,
        { id: 10, fullName: "Bob", username: "bob", email: "bob@example.com" } as any
      );
      expect(html).toContain('src="data:image/png;base64,FAKE"');
    });
  });
});
