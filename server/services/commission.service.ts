import { db } from "../db";
import { retailerCommissions, retailers } from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";
import { initiatePayout, generateDepositId } from "../utils/pawapay";
import { createLogger } from "../utils/logger";

const logger = createLogger("CommissionService");

export class CommissionService {
  /**
   * Record a commission for a completed POS registration.
   * Called after the ledger entry is created; fires silently (errors logged, not thrown).
   */
  static async recordCommission(
    ledgerEntryId: number,
    retailerId: number,
    transactionValue: number
  ) {
    const [retailer] = await db
      .select({ commissionRate: retailers.commissionRate })
      .from(retailers)
      .where(eq(retailers.id, retailerId));

    if (!retailer) throw new Error(`Retailer ${retailerId} not found`);

    const rate = parseFloat(retailer.commissionRate ?? "0.05");
    const commissionAmount = Math.floor(transactionValue * rate);

    const [commission] = await db
      .insert(retailerCommissions)
      .values({
        retailerId,
        ledgerEntryId,
        transactionValue: transactionValue.toString(),
        commissionAmount: commissionAmount.toString(),
        currency: "RWF",
        status: "pending",
      })
      .returning();

    logger.debug("Commission recorded", { commissionId: commission.id, commissionAmount });
    return commission;
  }

  /**
   * Mark a commission as queued for payout.
   * Validates that the retailer has a walletPhone configured.
   */
  static async queuePayout(commissionId: number) {
    const [commission] = await db
      .select()
      .from(retailerCommissions)
      .where(eq(retailerCommissions.id, commissionId));

    if (!commission) throw new Error(`Commission ${commissionId} not found`);
    if (commission.status !== "pending") {
      throw new Error(`Commission is already ${commission.status}`);
    }

    const [retailer] = await db
      .select({ walletPhone: retailers.walletPhone })
      .from(retailers)
      .where(eq(retailers.id, commission.retailerId));

    if (!retailer?.walletPhone) {
      throw Object.assign(
        new Error("Retailer has no wallet phone configured. Update it in Retailer Settings."),
        { status: 422 }
      );
    }

    const [updated] = await db
      .update(retailerCommissions)
      .set({ status: "queued", payoutDestination: retailer.walletPhone })
      .where(eq(retailerCommissions.id, commissionId))
      .returning();

    return updated;
  }

  /**
   * Process a queued commission by initiating a PawaPay MoMo transfer.
   * Admin-only — mutates status to 'processing' or 'failed'.
   */
  static async processPayout(commissionId: number) {
    const [commission] = await db
      .select()
      .from(retailerCommissions)
      .where(eq(retailerCommissions.id, commissionId));

    if (!commission) throw new Error(`Commission ${commissionId} not found`);
    if (commission.status !== "queued") {
      throw new Error(`Commission must be queued before processing (current: ${commission.status})`);
    }

    const payoutId = generateDepositId();

    try {
      const result = await initiatePayout({
        payoutId,
        phoneNumber: commission.payoutDestination!,
        amount: Math.round(parseFloat(commission.commissionAmount)),
        currency: commission.currency,
        narration: `KIZERE POS commission payout #${commission.id}`,
      });

      if (result.status === "ACCEPTED") {
        const [updated] = await db
          .update(retailerCommissions)
          .set({ status: "processing", pawapayPayoutId: result.payoutId })
          .where(eq(retailerCommissions.id, commissionId))
          .returning();
        logger.info("Payout initiated", { commissionId, pawapayPayoutId: result.payoutId });
        return updated;
      } else {
        const reason = result.rejectionReason?.rejectionMessage ?? result.status;
        const [updated] = await db
          .update(retailerCommissions)
          .set({ status: "failed", failureReason: reason })
          .where(eq(retailerCommissions.id, commissionId))
          .returning();
        logger.warn("Payout rejected", { commissionId, reason });
        return updated;
      }
    } catch (error: any) {
      await db
        .update(retailerCommissions)
        .set({ status: "failed", failureReason: error.message })
        .where(eq(retailerCommissions.id, commissionId));
      throw error;
    }
  }

  /**
   * Get paginated commission history for a retailer.
   */
  static async getCommissionHistory(
    retailerId: number,
    params: { page: number; limit: number }
  ) {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: count() })
      .from(retailerCommissions)
      .where(eq(retailerCommissions.retailerId, retailerId));

    const total = Number(countResult?.count ?? 0);

    const data = await db
      .select()
      .from(retailerCommissions)
      .where(eq(retailerCommissions.retailerId, retailerId))
      .orderBy(desc(retailerCommissions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
