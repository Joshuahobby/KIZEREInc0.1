import crypto from "crypto";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";
import { QRCodeService } from "./qrcode.service";
import type { OwnershipCertificate, Item, User } from "@shared/schema";

const logger = createLogger("CertificateService");

const APP_URL = process.env.APP_URL || "https://kizere.rw";

export class CertificateService {
  /**
   * Called from the payment webhook/verify after a successful ownership_certificate payment.
   * Resolves the item from payment metadata, generates a unique certificate code,
   * persists the record, and returns the certificate.
   */
  static async finalizeIssuance(paymentId: number): Promise<OwnershipCertificate> {
    const payment = await storage.getPayment(paymentId);
    if (!payment) throw new Error(`Certificate payment ${paymentId} not found`);

    const meta = payment.metadata as Record<string, any> | null;
    const itemId = payment.itemId ?? meta?.itemId;
    if (!itemId) {
      throw new Error(
        `Certificate payment ${paymentId} has no associated item (itemId required in payment or metadata)`
      );
    }

    const item = await storage.getItem(Number(itemId));
    if (!item) throw new Error(`Item ${itemId} not found`);

    // Idempotency: if a certificate already exists for this payment, return the first one
    const existing = await storage.getOwnershipCertificatesByItem(item.id);
    const alreadyIssued = existing.find(c => c.paymentId === paymentId);
    if (alreadyIssued) {
      logger.info("Certificate already issued for this payment — returning existing", { paymentId, certId: alreadyIssued.id });
      return alreadyIssued;
    }

    const certificateCode = `KZRC-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    const cert = await storage.createOwnershipCertificate({
      itemId: item.id,
      userId: payment.userId,
      paymentId,
      certificateCode,
      metadata: {
        itemName: item.name,
        category: item.category,
        uniqueIdentifier: item.uniqueIdentifier,
        issuedForUserId: payment.userId,
      },
    });

    logger.info("Ownership certificate issued", { certId: cert.id, certificateCode, itemId: item.id });

    // Fire-and-forget: send email with certificate HTML
    CertificateService.sendCertificateEmail(cert, item, payment.userId).catch(err =>
      logger.error("Failed to send certificate email", { error: err, certId: cert.id })
    );

    return cert;
  }

  /**
   * Send an email with the HTML certificate to the owner.
   */
  private static async sendCertificateEmail(
    cert: OwnershipCertificate,
    item: Item,
    userId: number
  ): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user?.email) return;

    const html = await CertificateService.generateHtml(cert, item, user);

    // Import Resend lazily to avoid hard-failing when key is absent in dev
    const { Resend } = await import("resend");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn("RESEND_API_KEY missing — certificate email skipped");
      return;
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.FROM_EMAIL || "KIZERE <noreply@kizere.rw>";

    await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: `Your KIZERE Ownership Certificate — ${item.name}`,
      html,
    });

    logger.info("Certificate email sent", { to: user.email, certId: cert.id });
  }

  /**
   * Generate the HTML body for an ownership certificate.
   * Embeds a QR code data-URL that links to the public verification page.
   */
  static async generateHtml(cert: OwnershipCertificate, item: Item, owner: User): Promise<string> {
    const verifyUrl = `${APP_URL}/verify/certificate/${cert.certificateCode}`;
    const qrDataUrl = await QRCodeService.generateDataURL(verifyUrl);
    const issuedDate = cert.issuedAt.toLocaleDateString("en-RW", {
      year: "numeric", month: "long", day: "numeric",
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>KIZERE Ownership Certificate</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; color: #333; }
    .cert { max-width: 700px; margin: 0 auto; background: #fff; border: 2px solid #1a56db; border-radius: 8px; overflow: hidden; }
    .header { background: #1a56db; color: #fff; text-align: center; padding: 24px 16px; }
    .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 28px 32px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px; }
    .value { font-size: 16px; font-weight: bold; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
    .cert-code { font-size: 20px; font-family: monospace; letter-spacing: 3px; color: #1a56db; margin: 12px 0 20px; }
    .qr-section { text-align: center; padding: 16px 0; border-top: 1px solid #e5e7eb; margin-top: 16px; }
    .qr-section img { width: 140px; height: 140px; }
    .qr-section p { font-size: 11px; color: #6b7280; margin: 6px 0 0; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; padding: 12px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="header">
      <h1>KIZERE Item Ownership Certificate</h1>
      <p>Official record of registered ownership — kizere.rw</p>
    </div>
    <div class="body">
      <p class="section-title">Certificate Number</p>
      <p class="cert-code">${cert.certificateCode}</p>

      <div class="grid">
        <div>
          <p class="section-title">Owner</p>
          <p class="value">${owner.fullName || owner.username}</p>
        </div>
        <div>
          <p class="section-title">Issued On</p>
          <p class="value">${issuedDate}</p>
        </div>
        <div>
          <p class="section-title">Item Name</p>
          <p class="value">${item.name}</p>
        </div>
        <div>
          <p class="section-title">Category</p>
          <p class="value">${item.category}</p>
        </div>
        <div>
          <p class="section-title">Unique Identifier</p>
          <p class="value">${item.uniqueIdentifier}</p>
        </div>
        <div>
          <p class="section-title">KIZERE Item ID</p>
          <p class="value">#${item.id}</p>
        </div>
      </div>

      <div class="qr-section">
        <img src="${qrDataUrl}" alt="Verification QR Code" />
        <p>Scan to verify this certificate at kizere.rw</p>
      </div>
    </div>
    <div class="footer">
      This certificate is issued by KIZERE Rwanda and can be verified at ${verifyUrl}
    </div>
  </div>
</body>
</html>`;
  }
}
