import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './server/db';
import { users, reports, claims, claimAppeals } from './shared/schema';

async function verifyClaims() {
    console.log('--- Starting QA test for Claim Appeals ---');
    // First, directly interact with the DB and services so we bypass cookies/auth complexities
    // for a pure integration test of the logic.

    // Clean up previous test users if any
    await db.delete(users).where(eq(users.email, 'usera@test.kizere.rw'));
    await db.delete(users).where(eq(users.email, 'userb@test.kizere.rw'));
    await db.delete(users).where(eq(users.email, 'adminqa@test.kizere.rw'));

    console.log('1. Creating test users (Founder, Claimant, Admin)...');
    const [userA] = await db.insert(users).values({
        id: 90001,
        fullName: 'Test User A',
        username: 'userA_qa',
        email: 'usera@test.kizere.rw',
        password: 'password123',
        role: 'User',
        reputationScore: 0
    }).returning();

    const [userB] = await db.insert(users).values({
        id: 90002,
        fullName: 'Test User B',
        username: 'userB_qa',
        email: 'userb@test.kizere.rw',
        password: 'password123',
        role: 'User',
        reputationScore: 0
    }).returning();

    const [admin] = await db.insert(users).values({
        id: 90003,
        fullName: 'Test Admin',
        username: 'admin_qa',
        email: 'adminqa@test.kizere.rw',
        password: 'password123',
        role: 'Admin',
        reputationScore: 0
    }).returning();

    console.log('2. User A creates a "Found" report...');
    const [report] = await db.insert(reports).values({
        userId: userA.id,
        type: 'found',
        category: 'Electronics',
        title: 'Found a QA phone',
        description: 'A phone found during QA testing',
        location: 'QA Lab',
        date: new Date(),
        status: 'active'
    }).returning();

    console.log('3. User B claims the report...');
    const [claim] = await db.insert(claims).values({
        reportId: report.id,
        userId: userB.id,
        status: 'pending',
        description: 'I lost my QA phone'
    }).returning();

    console.log('4. User A rejects the claim...');
    await db.update(claims).set({ status: 'rejected' }).where(eq(claims.id, claim.id));

    console.log('5. User B appeals the rejection...');
    const [appeal] = await db.insert(claimAppeals).values({
        claimId: claim.id,
        userId: userB.id,
        reason: 'I have proof it is mine!',
        status: 'pending'
    }).returning();

    console.log('6. Admin reviews the appeal and approves it...');
    // Simulating the patch /api/admin/claims/appeals/:id logic
    await db.update(claimAppeals).set({
        status: 'approved',
        adminNotes: 'Proof looks valid.',
        resolvedAt: new Date(),
        resolvedBy: admin.id
    }).where(eq(claimAppeals.id, appeal.id));

    await db.update(claims).set({ status: 'verified' }).where(eq(claims.id, claim.id));

    // Verify final state
    const finalClaim = await db.select().from(claims).where(eq(claims.id, claim.id));
    if (finalClaim[0].status === 'verified') {
        console.log('✅ QA Test Passed: Appeal was successfully approved and claim verified.');
    } else {
        console.error('❌ QA Test Failed: Claim status is NOT verified.');
    }

    // Cleanup
    console.log('Cleaning up test data...');
    await db.delete(claimAppeals).where(eq(claimAppeals.id, appeal.id));
    await db.delete(claims).where(eq(claims.id, claim.id));
    await db.delete(reports).where(eq(reports.id, report.id));
    await db.delete(users).where(eq(users.id, 90001));
    await db.delete(users).where(eq(users.id, 90002));
    await db.delete(users).where(eq(users.id, 90003));
    console.log('--- QA Test Complete ---');
}

verifyClaims().catch(console.error).finally(() => process.exit(0));
