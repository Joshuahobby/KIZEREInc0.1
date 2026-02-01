import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { verificationRequests, users, type VerificationRequest, type InsertVerificationRequest, type User } from "@shared/schema";

export async function createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
  const [newRequest] = await db.insert(verificationRequests).values(request).returning();
  
  // Also update user's verification status to 'pending'
  await db.update(users)
    .set({ verificationStatus: 'pending' })
    .where(eq(users.id, request.userId));
    
  return newRequest;
}

export async function getVerificationRequest(userId: number): Promise<VerificationRequest | undefined> {
  // Get the most recent request
  const [request] = await db.select()
    .from(verificationRequests)
    .where(eq(verificationRequests.userId, userId))
    .orderBy(desc(verificationRequests.submittedAt))
    .limit(1);
  return request;
}

export async function getPendingVerificationRequests(): Promise<(VerificationRequest & { user: User })[]> {
  const results = await db.select({
    requestId: verificationRequests.id,
    userId: verificationRequests.userId,
    documentType: verificationRequests.documentType,
    documentUrl: verificationRequests.documentUrl,
    selfieUrl: verificationRequests.selfieUrl,
    status: verificationRequests.status,
    submittedAt: verificationRequests.submittedAt,
    user: users
  })
  .from(verificationRequests)
  .leftJoin(users, eq(verificationRequests.userId, users.id))
  .where(eq(verificationRequests.status, 'pending'))
  .orderBy(desc(verificationRequests.submittedAt));
  
  // Map to correct structure
  return results.map(r => ({
    id: r.requestId,
    userId: r.userId,
    documentType: r.documentType,
    documentUrl: r.documentUrl,
    selfieUrl: r.selfieUrl,
    status: r.status,
    submittedAt: r.submittedAt,
    adminComment: null, // Basic properties
    reviewedBy: null,
    reviewedAt: null,
    user: r.user!
  }));
}

export async function updateVerificationRequestStatus(
  id: number, 
  status: 'approved' | 'rejected', 
  adminId: number,
  comment?: string
): Promise<VerificationRequest | undefined> {
  const [updated] = await db.update(verificationRequests)
    .set({ 
      status, 
      reviewedBy: adminId,
      reviewedAt: new Date(),
      adminComment: comment
    })
    .where(eq(verificationRequests.id, id))
    .returning();
    
  if (updated) {
    // Start transaction or just update user sequentially
    // Use 'active' if approved? No, verificationStatus = 'approved'
    // Scheme: verificationStatus matches request status usually
    await db.update(users)
      .set({ verificationStatus: status })
      .where(eq(users.id, updated.userId));
  }
  
  return updated;
}
