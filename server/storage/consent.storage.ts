import { db } from "../db";
import { consentRecords, ConsentRecord, InsertConsentRecord } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Get all active (non-withdrawn) consent records for a user
 */
export async function getUserConsents(userId: number): Promise<ConsentRecord[]> {
  const results = await db
    .select()
    .from(consentRecords)
    .where(and(
      eq(consentRecords.userId, userId),
      isNull(consentRecords.withdrawnAt)
    ));
  return results as ConsentRecord[];
}

/**
 * Get all consent records for a user (including withdrawn)
 */
export async function getUserConsentHistory(userId: number): Promise<ConsentRecord[]> {
  const results = await db
    .select()
    .from(consentRecords)
    .where(eq(consentRecords.userId, userId));
  return results as ConsentRecord[];
}

/**
 * Check if a user has active consent for a specific type
 */
export async function hasActiveConsent(userId: number, consentType: string): Promise<boolean> {
  const results = await db
    .select()
    .from(consentRecords)
    .where(and(
      eq(consentRecords.userId, userId),
      eq(consentRecords.consentType, consentType),
      isNull(consentRecords.withdrawnAt)
    ));
  return results.length > 0;
}

/**
 * Record a new consent grant
 */
export async function createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord> {
  const [result] = await db
    .insert(consentRecords)
    .values(record)
    .returning();
  return result as ConsentRecord;
}

/**
 * Withdraw a specific consent type for a user
 */
export async function withdrawConsent(userId: number, consentType: string): Promise<ConsentRecord | undefined> {
  const [result] = await db
    .update(consentRecords)
    .set({
      withdrawnAt: new Date(),
      consentGiven: false,
    })
    .where(and(
      eq(consentRecords.userId, userId),
      eq(consentRecords.consentType, consentType),
      isNull(consentRecords.withdrawnAt)
    ))
    .returning();
  return result as ConsentRecord | undefined;
}

/**
 * Delete all consent records for a user (for account deletion)
 */
export async function deleteUserConsents(userId: number): Promise<void> {
  await db
    .delete(consentRecords)
    .where(eq(consentRecords.userId, userId));
}
