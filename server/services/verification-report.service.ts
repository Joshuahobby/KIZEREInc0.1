import { storage } from "../storage";
import { createLogger } from "../utils/logger";
import type { Item, PosProduct, User } from "@shared/schema";

const logger = createLogger("VerificationReportService");

// How long a purchased report remains accessible (48 hours)
const REPORT_TTL_MS = 48 * 60 * 60 * 1000;

export class VerificationReportService {
  /**
   * Finalize a completed verification_report payment.
   * Resolves the identifier from payment metadata, builds and snapshots the
   * full report, then persists a VerificationPurchase row with a 48-hour expiry.
   */
  static async finalizeReport(paymentId: number): Promise<void> {
    const payment = await storage.getPayment(paymentId);
    if (!payment) {
      throw new Error(`Verification report payment ${paymentId} not found`);
    }

    const meta = payment.metadata as Record<string, any> | null;
    const identifier: string | undefined = meta?.identifier;
    if (!identifier) {
      throw new Error(
        `Verification report payment ${paymentId} has no identifier in metadata`
      );
    }

    const item = await storage.getItemByUniqueIdentifier(identifier);
    let reportData: Record<string, any>;
    let itemId: number | null = null;

    if (item) {
      reportData = await VerificationReportService.buildReport(item, identifier);
      itemId = item.id;
    } else {
      const posProduct = await storage.getPosProductBySerialWithRetailer(identifier);
      reportData = posProduct
        ? await VerificationReportService.buildPosReport(posProduct, identifier)
        : await VerificationReportService.buildReport(null, identifier);
    }

    const expiresAt = new Date(Date.now() + REPORT_TTL_MS);

    await storage.createVerificationPurchase({
      userId: payment.userId,
      identifier,
      itemId,
      reportData,
      paymentId: payment.id,
      expiresAt,
    });

    logger.info("Verification report purchase finalized", {
      paymentId,
      userId: payment.userId,
      identifier,
      expiresAt,
    });
  }

  /**
   * Return the full report for a user if they have an active purchase, or if
   * they are premium (bypass pay-gate).
   * Returns null if no access.
   */
  static async getReport(
    userId: number,
    identifier: string
  ): Promise<Record<string, any> | null> {
    const user = await storage.getUser(userId);
    if (!user) return null;

    // Premium users bypass the pay-gate — build report on-the-fly
    const isPremium =
      user.premiumExpiresAt != null && user.premiumExpiresAt > new Date();

    if (isPremium) {
      const item = await storage.getItemByUniqueIdentifier(identifier);
      if (item) return VerificationReportService.buildReport(item, identifier);
      const posProduct = await storage.getPosProductBySerialWithRetailer(identifier);
      if (posProduct) return VerificationReportService.buildPosReport(posProduct, identifier);
      return VerificationReportService.buildReport(null, identifier);
    }

    // Non-premium: check for an active purchase
    const purchase = await storage.getActiveVerificationPurchase(userId, identifier);
    if (!purchase) return null;

    return purchase.reportData as Record<string, any>;
  }

  /**
   * Build the full report JSON snapshot for a given item.
   * If the item does not exist, returns a minimal "not found" report.
   */
  static async buildReport(
    item: Item | null,
    identifier: string
  ): Promise<Record<string, any>> {
    if (!item) {
      return {
        identifier,
        isRegistered: false,
        isFlagged: false,
        status: null,
        category: null,
        name: null,
        owner: null,
        registeredAt: null,
      };
    }

    let owner: Pick<User, "fullName" | "email" | "phoneNumber"> | null = null;
    const ownerRaw = await storage.getUser(item.userId);
    if (ownerRaw) {
      owner = {
        fullName: ownerRaw.fullName,
        email: ownerRaw.email,
        phoneNumber: ownerRaw.phoneNumber ?? null,
      };
    }

    const isFlagged = ["Lost", "Stolen"].includes(item.status);

    return {
      identifier,
      isRegistered: true,
      isFlagged,
      status: item.status,
      category: item.category,
      name: item.name,
      owner,
      registeredAt: item.registeredAt,
    };
  }

  /**
   * Build the free (public) summary — no owner info, minimal fields.
   * Checks the items registry first, then falls back to POS products.
   */
  static async buildFreeSummary(identifier: string): Promise<Record<string, any>> {
    const item = await storage.getItemByUniqueIdentifier(identifier);
    if (item) {
      const isFlagged = ["Lost", "Stolen"].includes(item.status);
      return {
        identifier,
        isRegistered: true,
        isFlagged,
        status: item.status,
        category: item.category,
        source: "registry",
      };
    }

    // Fall back to POS product registry
    const posProduct = await storage.getPosProductBySerialWithRetailer(identifier);
    if (posProduct) {
      const isFlagged = posProduct.status === "stolen";
      return {
        identifier,
        isRegistered: true,
        isFlagged,
        status: posProduct.status,
        category: posProduct.category || "Product",
        source: "pos",
        retailerName: posProduct.retailerName,
      };
    }

    return { identifier, isRegistered: false, isFlagged: false, status: null, category: null };
  }

  /**
   * Build a full report for a POS product.
   * Shows current owner if they are a KIZERE user; otherwise owner is null.
   */
  static async buildPosReport(
    posProduct: PosProduct & { retailerName: string | null },
    identifier: string
  ): Promise<Record<string, any>> {
    const isFlagged = posProduct.status === "stolen";

    let owner: Pick<User, "fullName" | "email" | "phoneNumber"> | null = null;
    if (posProduct.currentOwnerId) {
      const ownerUser = await storage.getUser(posProduct.currentOwnerId);
      if (ownerUser) {
        owner = {
          fullName: ownerUser.fullName,
          email: ownerUser.email,
          phoneNumber: ownerUser.phoneNumber ?? null,
        };
      }
    }

    return {
      identifier,
      isRegistered: true,
      isFlagged,
      status: posProduct.status,
      category: posProduct.category || "Product",
      name: posProduct.name,
      owner,
      registeredAt: posProduct.registrationDate,
      source: "pos",
      retailerName: posProduct.retailerName,
      kizereId: posProduct.kizereId,
    };
  }
}
