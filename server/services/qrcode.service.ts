import QRCode from "qrcode";
import { createLogger } from "../utils/logger";

const logger = createLogger("QRCodeService");

export class QRCodeService {
  /**
   * Generates a Data URL for a QR code
   * @param text The text/URL to encode
   */
  static async generateDataURL(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 300,
      });
    } catch (error) {
      logger.error("Failed to generate QR Code Data URL", { error, text });
      throw new Error("Failed to generate QR Code");
    }
  }

  /**
   * Generates an SVG string for a QR code
   * @param text The text/URL to encode
   */
  static async generateSVG(text: string): Promise<string> {
    try {
      return await QRCode.toString(text, {
        type: "svg",
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        }
      });
    } catch (error) {
      logger.error("Failed to generate QR Code SVG", { error, text });
      throw new Error("Failed to generate QR Code");
    }
  }

  /**
   * Generates a buffer for a QR code image (PNG)
   * @param text The text/URL to encode
   */
  static async generateBuffer(text: string): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(text, {
        margin: 2,
        width: 600
      });
    } catch (error) {
      logger.error("Failed to generate QR Code Buffer", { error, text });
      throw new Error("Failed to generate QR Code");
    }
  }
}
