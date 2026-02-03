import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { claims, reports, users, type Claim, type InsertClaim } from "@shared/schema";

/**
 * Get a single claim by ID
 */
export async function getClaim(id: number): Promise<Claim | undefined> {
  const [claim] = await db.select().from(claims).where(eq(claims.id, id));
  return claim;
}

/**
 * Get claim with related report and user details
 */
export async function getClaimWithDetails(id: number): Promise<any> {
  const result = await db.select({
    id: claims.id,
    userId: claims.userId,
    reportId: claims.reportId,
    description: claims.description,
    imageUrls: claims.imageUrls,
    status: claims.status,
    finderNotes: claims.finderNotes,
    createdAt: claims.createdAt,
    updatedAt: claims.updatedAt,
    verifiedAt: claims.verifiedAt,
    reportTitle: reports.title,
    reportType: reports.type,
    claimantName: users.fullName,
    claimantEmail: users.email
  })
    .from(claims)
    .leftJoin(reports, eq(claims.reportId, reports.id))
    .leftJoin(users, eq(claims.userId, users.id))
    .where(eq(claims.id, id));
  
  return result[0];
}

/**
 * Get all claims for a specific report
 */
export async function getClaimsForReport(reportId: number): Promise<Claim[]> {
  return await db.select().from(claims).where(eq(claims.reportId, reportId)).orderBy(desc(claims.createdAt));
}

/**
 * Get claims for a report with user details (for finder review)
 */
export async function getClaimsForReportWithUsers(reportId: number): Promise<any[]> {
  return await db.select({
    id: claims.id,
    userId: claims.userId,
    reportId: claims.reportId,
    description: claims.description,
    imageUrls: claims.imageUrls,
    status: claims.status,
    finderNotes: claims.finderNotes,
    createdAt: claims.createdAt,
    updatedAt: claims.updatedAt,
    verifiedAt: claims.verifiedAt,
    claimantName: users.fullName,
    claimantUsername: users.username,
    claimantVerificationStatus: users.verificationStatus,
    claimantAvatarUrl: users.avatarUrl
  })
    .from(claims)
    .leftJoin(users, eq(claims.userId, users.id))
    .where(eq(claims.reportId, reportId))
    .orderBy(desc(claims.createdAt));
}

/**
 * Get user's submitted claims
 */
export async function getUserClaims(userId: number): Promise<Claim[]> {
  return await db.select().from(claims).where(eq(claims.userId, userId)).orderBy(desc(claims.createdAt));
}

/**
 * Get user's claims with report details
 */
export async function getUserClaimsWithReports(userId: number): Promise<any[]> {
  return await db.select({
    id: claims.id,
    userId: claims.userId,
    reportId: claims.reportId,
    description: claims.description,
    imageUrls: claims.imageUrls,
    status: claims.status,
    finderNotes: claims.finderNotes,
    createdAt: claims.createdAt,
    updatedAt: claims.updatedAt,
    verifiedAt: claims.verifiedAt,
    reportTitle: reports.title,
    reportType: reports.type,
    reportStatus: reports.status,
    reportLocation: reports.location,
    reportImageUrls: reports.imageUrls
  })
    .from(claims)
    .leftJoin(reports, eq(claims.reportId, reports.id))
    .where(eq(claims.userId, userId))
    .orderBy(desc(claims.createdAt));
}

/**
 * Get claims received for user's found items
 */
export async function getClaimsReceived(userId: number): Promise<Claim[]> {
  const result = await db.select({
    id: claims.id,
    userId: claims.userId,
    reportId: claims.reportId,
    description: claims.description,
    imageUrls: claims.imageUrls,
    status: claims.status,
    finderNotes: claims.finderNotes,
    createdAt: claims.createdAt,
    updatedAt: claims.updatedAt,
    verifiedAt: claims.verifiedAt,
  })
    .from(claims)
    .innerJoin(reports, eq(claims.reportId, reports.id))
    .where(eq(reports.userId, userId))
    .orderBy(desc(claims.createdAt));
  
  return result;
}

/**
 * Get claims received with full details (for finder dashboard)
 */
export async function getClaimsReceivedWithDetails(userId: number): Promise<any[]> {
  return await db.select({
    id: claims.id,
    userId: claims.userId,
    reportId: claims.reportId,
    description: claims.description,
    imageUrls: claims.imageUrls,
    status: claims.status,
    finderNotes: claims.finderNotes,
    createdAt: claims.createdAt,
    updatedAt: claims.updatedAt,
    verifiedAt: claims.verifiedAt,
    reportTitle: reports.title,
    reportType: reports.type,
    reportStatus: reports.status,
    reportImageUrls: reports.imageUrls,
    claimantName: users.fullName,
    claimantUsername: users.username,
    claimantVerificationStatus: users.verificationStatus
  })
    .from(claims)
    .innerJoin(reports, eq(claims.reportId, reports.id))
    .leftJoin(users, eq(claims.userId, users.id))
    .where(eq(reports.userId, userId))
    .orderBy(desc(claims.createdAt));
}

/**
 * Phase 1.1: Check if user already has a claim on a specific report
 */
export async function getUserClaimForReport(userId: number, reportId: number): Promise<Claim | undefined> {
  const [existingClaim] = await db.select()
    .from(claims)
    .where(and(
      eq(claims.userId, userId),
      eq(claims.reportId, reportId)
    ));
  return existingClaim;
}

/**
 * Create a new claim
 */
export async function createClaim(claim: InsertClaim): Promise<Claim> {
  const [newClaim] = await db.insert(claims).values(claim).returning();
  return newClaim;
}

/**
 * Update a claim
 */
export async function updateClaim(id: number, claimData: Partial<Claim>): Promise<Claim | undefined> {
  const [updatedClaim] = await db.update(claims)
    .set({ ...claimData, updatedAt: new Date() })
    .where(eq(claims.id, id))
    .returning();
  return updatedClaim;
}

/**
 * Get claim statistics for dashboard
 */
export async function getClaimStats(): Promise<any> {
  const allClaims = await db.select().from(claims);
  
  return {
    totalClaims: allClaims.length,
    pendingClaims: allClaims.filter(c => c.status === 'pending').length,
    verifiedClaims: allClaims.filter(c => c.status === 'verified').length,
    rejectedClaims: allClaims.filter(c => c.status === 'rejected').length,
    resolvedClaims: allClaims.filter(c => c.status === 'resolved').length
  };
}

/**
 * Get claims by status
 */
export async function getClaimsByStatus(status: string): Promise<Claim[]> {
  return await db.select()
    .from(claims)
    .where(eq(claims.status, status))
    .orderBy(desc(claims.createdAt));
}

// Claim status log storage (uses in-memory or JSON for now, can be upgraded to table)
const claimStatusLogs: any[] = [];

/**
 * Create a claim status change log entry
 */
export async function createClaimStatusLog(log: {
  claimId: number;
  previousStatus: string;
  newStatus: string;
  changedBy: number;
  notes?: string;
}): Promise<any> {
  const entry = {
    id: claimStatusLogs.length + 1,
    ...log,
    timestamp: new Date()
  };
  claimStatusLogs.push(entry);
  return entry;
}

/**
 * Get status change history for a claim
 */
export async function getClaimStatusHistory(claimId: number): Promise<any[]> {
  return claimStatusLogs.filter(log => log.claimId === claimId);
}

// Claim appeals storage (uses in-memory for now, can be upgraded to table)
const claimAppeals: any[] = [];

/**
 * Create a claim appeal
 */
export async function createClaimAppeal(appeal: {
  claimId: number;
  userId: number;
  reason: string;
  status: string;
}): Promise<any> {
  const entry = {
    id: claimAppeals.length + 1,
    ...appeal,
    createdAt: new Date()
  };
  claimAppeals.push(entry);
  return entry;
}

/**
 * Get appeal for a claim
 */
export async function getClaimAppeal(claimId: number): Promise<any> {
  return claimAppeals.find(a => a.claimId === claimId);
}

/**
 * Get all pending appeals (for admin)
 */
export async function getPendingAppeals(): Promise<any[]> {
  return claimAppeals.filter(a => a.status === 'pending');
}
