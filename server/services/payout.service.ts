import { db } from "../db";
import { payouts, reports, users, Payout, Report } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { initiatePayout, generateDepositId } from "../utils/pawapay";
import { createLogger } from "../utils/logger";

const logger = createLogger("PayoutService");

export class PayoutService {
    /**
     * Create a payout record for a verified claim
     */
    async createPayout(
        userId: number,
        reportId: number,
        amount: number,
        destination: number | string // Phone number
    ): Promise<Payout> {
        const [payout] = await db.insert(payouts).values({
            userId,
            reportId,
            amount: amount.toString(),
            status: 'pending',
            destination: destination.toString(),
            currency: 'RWF', // Default currency
        }).returning();

        return payout;
    }

    /**
     * Process a pending payout via PawaPay
     */
    async processPayout(payoutId: number): Promise<Payout> {
        const payout = await db.query.payouts.findFirst({
            where: eq(payouts.id, payoutId)
        });

        if (!payout) {
            throw new Error(`Payout ${payoutId} not found`);
        }

        if (payout.status !== 'pending') {
            logger.warn(`Payout ${payoutId} is already ${payout.status}`);
            return payout;
        }

        // Check user verification status
        const user = await db.query.users.findFirst({
            where: eq(users.id, payout.userId)
        });

        if (user?.role === 'Subscriber' && user.verificationStatus !== 'approved') {
            const errorMsg = `User ${payout.userId} must be verified to receive payouts`;
            logger.warn(errorMsg);
            
            await db.update(payouts)
                .set({ 
                    status: 'failed',
                    failureReason: 'Identity verification required'
                })
                .where(eq(payouts.id, payoutId));
                
            throw new Error(errorMsg);
        }

        // Update status to processing
        await db.update(payouts)
            .set({ status: 'processing' })
            .where(eq(payouts.id, payoutId));

        try {
            // Initiate payout via PawaPay
            const payoutResponse = await initiatePayout({
                payoutId: generateDepositId(),
                phoneNumber: payout.destination,
                amount: Number(payout.amount),
                currency: payout.currency,
                narration: `Bounty payout for Report #${payout.reportId}`,
            });

            if (payoutResponse.status === 'ACCEPTED') {
                const [updatedPayout] = await db.update(payouts)
                    .set({
                        status: 'processing', // PawaPay payouts are async — final status comes via callback
                        providerRef: payoutResponse.payoutId,
                        processedAt: new Date()
                    })
                    .where(eq(payouts.id, payoutId))
                    .returning();

                // Update report bounty status
                await db.update(reports)
                    .set({ bountyStatus: 'released' })
                    .where(eq(reports.id, payout.reportId));

                return updatedPayout;
            } else {
                throw new Error(payoutResponse.rejectionReason?.rejectionMessage || 'Payout rejected');
            }

        } catch (error) {
            logger.error(`Payout processing failed for ${payoutId}`, { error });

            const [failedPayout] = await db.update(payouts)
                .set({
                    status: 'failed',
                    failureReason: error instanceof Error ? error.message : 'Unknown error',
                    processedAt: new Date()
                })
                .where(eq(payouts.id, payoutId))
                .returning();

            return failedPayout;
        }
    }

    /**
     * Retry a failed payout
     */
    async retryPayout(payoutId: number): Promise<Payout> {
        const payout = await db.query.payouts.findFirst({
            where: eq(payouts.id, payoutId)
        });

        if (!payout || payout.status !== 'failed') {
            throw new Error(`Payout ${payoutId} is not in a failed state`);
        }

        // Reset status to pending to be picked up again
        const [resetPayout] = await db.update(payouts)
            .set({ status: 'pending', failureReason: null })
            .where(eq(payouts.id, payoutId))
            .returning();

        return this.processPayout(resetPayout.id);
    }
}

export const payoutService = new PayoutService();
