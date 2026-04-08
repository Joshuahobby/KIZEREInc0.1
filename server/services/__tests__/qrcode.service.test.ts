import { describe, it, expect, vi, beforeEach } from "vitest";
import { QRCodeService } from "../qrcode.service";
import QRCode from "qrcode";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(),
    toString: vi.fn(),
    toBuffer: vi.fn(),
  },
}));

const mockedQRCode = vi.mocked(QRCode);

describe("QRCodeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateDataURL", () => {
    it("returns the data URL from qrcode library", async () => {
      (mockedQRCode.toDataURL as any).mockResolvedValueOnce("data:image/png;base64,abc123");
      const result = await QRCodeService.generateDataURL("https://kizere.rw/verify/SN123");
      expect(result).toBe("data:image/png;base64,abc123");
      expect(mockedQRCode.toDataURL).toHaveBeenCalledWith("https://kizere.rw/verify/SN123", expect.objectContaining({
        margin: 2,
        width: 300,
      }));
    });

    it("throws when qrcode library fails", async () => {
      (mockedQRCode.toDataURL as any).mockRejectedValueOnce(new Error("encode error"));
      await expect(QRCodeService.generateDataURL("bad")).rejects.toThrow("Failed to generate QR Code");
    });
  });

  describe("generateSVG", () => {
    it("returns SVG string from qrcode library", async () => {
      (mockedQRCode.toString as any).mockResolvedValueOnce("<svg>...</svg>");
      const result = await QRCodeService.generateSVG("https://kizere.rw/verify/SN123");
      expect(result).toBe("<svg>...</svg>");
      expect(mockedQRCode.toString).toHaveBeenCalledWith("https://kizere.rw/verify/SN123", expect.objectContaining({
        type: "svg",
        margin: 2,
      }));
    });

    it("throws when qrcode library fails", async () => {
      (mockedQRCode.toString as any).mockRejectedValueOnce(new Error("svg error"));
      await expect(QRCodeService.generateSVG("bad")).rejects.toThrow("Failed to generate QR Code");
    });
  });

  describe("generateBuffer", () => {
    it("returns a buffer from qrcode library", async () => {
      const buf = Buffer.from("fake-png");
      (mockedQRCode.toBuffer as any).mockResolvedValueOnce(buf);
      const result = await QRCodeService.generateBuffer("https://kizere.rw/verify/SN123");
      expect(result).toBe(buf);
      expect(mockedQRCode.toBuffer).toHaveBeenCalledWith("https://kizere.rw/verify/SN123", expect.objectContaining({
        margin: 2,
        width: 600,
      }));
    });

    it("throws when qrcode library fails", async () => {
      (mockedQRCode.toBuffer as any).mockRejectedValueOnce(new Error("buffer error"));
      await expect(QRCodeService.generateBuffer("bad")).rejects.toThrow("Failed to generate QR Code");
    });
  });
});
