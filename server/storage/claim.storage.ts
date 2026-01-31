import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { claims, reports, type Claim, type InsertClaim } from "@shared/schema";

export async function getClaim(id: number): Promise<Claim | undefined> {
  const [claim] = await db.select().from(claims).where(eq(claims.id, id));
  return claim;
}

export async function getClaimsForReport(reportId: number): Promise<Claim[]> {
  return await db.select().from(claims).where(eq(claims.reportId, reportId)).orderBy(desc(claims.createdAt));
}

export async function getUserClaims(userId: number): Promise<Claim[]> {
  return await db.select().from(claims).where(eq(claims.userId, userId)).orderBy(desc(claims.createdAt));
}

export async function getClaimsReceived(userId: number): Promise<Claim[]> {
  const result = await db.select({
    claim: claims
  })
  .from(claims)
  .innerJoin(reports, eq(claims.reportId, reports.id))
  .where(eq(reports.userId, userId))
  .orderBy(desc(claims.createdAt));
  
  return result.map(r => r.claim);
}

export async function createClaim(claim: InsertClaim): Promise<Claim> {
  const [newClaim] = await db.insert(claims).values(claim).returning();
  return newClaim;
}

export async function updateClaim(id: number, claimData: Partial<Claim>): Promise<Claim | undefined> {
  const [updatedClaim] = await db.update(claims)
    .set({ ...claimData, updatedAt: new Date() })
    .where(eq(claims.id, id))
    .returning();
  return updatedClaim;
}
