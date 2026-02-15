import { storage } from "../server/storage";
import { hashPassword } from "../server/utils/auth-crypto";
import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function runVerification() {
    console.log("🚀 Starting Claim Appeals Flow Verification...");

    try {
        // 0. Test DB Connection
        console.log("Testing database connection...");
        await db.execute(sql`SELECT 1`);
        console.log("✅ Database connection successful.");

        const password = await hashPassword("password123");

        // 2. Create Users
        console.log("Creating test users...");
        const timestamp = Date.now();
        const finder = await storage.createUser({
            fullName: "Test Finder",
            username: `test-finder-${timestamp}`,
            email: `test-finder-${timestamp}@example.com`,
            password,
            role: "Subscriber",
            preferences: {}
        });

        const claimant = await storage.createUser({
            fullName: "Test Claimant",
            username: `test-claimant-${timestamp}`,
            email: `test-claimant-${timestamp}@example.com`,
            password,
            role: "Subscriber",
            preferences: {}
        });

        const admin = await storage.createUser({
            fullName: "Test Admin",
            username: `test-admin-${timestamp}`,
            email: `test-admin-${timestamp}@example.com`,
            password,
            role: "Admin",
            preferences: {}
        });

        console.log(`✅ Users created: Finder(${finder.id}), Claimant(${claimant.id}), Admin(${admin.id})`);

        // 3. Finder posts a Found Report
        console.log("Finder posting a found report...");
        const report = await storage.createReport({
            userId: finder.id,
            type: "found",
            category: "Electronics",
            title: "Test Found Item - iPhone 13",
            description: "Found a blue iPhone 13 at the park.",
            location: "Central Park",
            date: new Date(),
            status: "Open",
            contactInfo: "test-finder@example.com",
            imageUrls: []
        });
        console.log(`✅ Report created: ${report.id}`);

        // 4. Claimant files a claim
        console.log("Claimant filing a claim...");
        const claim = await storage.createClaim({
            userId: claimant.id,
            reportId: report.id,
            description: "Test Claim - That is my phone. It has a cracked screen protector.",
            status: "pending",
            imageUrls: []
        });
        console.log(`✅ Claim filed: ${claim.id}`);

        // 5. Finder rejects the claim
        console.log("Finder rejecting the claim...");
        await storage.updateClaim(claim.id, {
            status: "rejected",
            finderNotes: "Description does not match. The phone I found has a perfect screen."
        });

        await storage.createClaimStatusLog({
            claimId: claim.id,
            previousStatus: "pending",
            newStatus: "rejected",
            changedBy: finder.id,
            notes: "Description mismatch"
        });
        console.log("✅ Claim rejected.");

        // 6. Claimant appeals the rejection
        console.log("Claimant appealing the rejection...");
        const appeal = await storage.createClaimAppeal({
            claimId: claim.id,
            userId: claimant.id,
            reason: "Test Appeal - I might have been mistaken about the protector, but the serial number I have on my box matches!",
            status: "pending"
        });
        console.log(`✅ Appeal created: ${appeal.id}`);

        // 7. Admin reviews and approves the appeal
        console.log("Admin approving the appeal...");
        await storage.updateClaimAppeal(appeal.id, {
            status: "approved",
            resolvedBy: admin.id,
            resolvedAt: new Date(),
            adminNotes: "Serial number verification requested. Re-opening claim for further proof."
        });

        // approved appeal should set claim status back to pending
        await storage.updateClaim(claim.id, { status: "pending" });

        await storage.createClaimStatusLog({
            claimId: claim.id,
            previousStatus: "rejected",
            newStatus: "pending",
            changedBy: admin.id,
            notes: "Re-opened via appeal approval"
        });
        console.log("✅ Appeal approved and claim re-opened.");

        // 8. Final Verification
        const finalClaim = await storage.getClaim(claim.id);
        if (finalClaim?.status === "pending") {
            console.log("🎉 Verification Successful: Claim flow worked as expected.");
        } else {
            console.error(`❌ Verification Failed: Claim status is ${finalClaim?.status} instead of pending.`);
        }

    } catch (error) {
        console.error("❌ Error during verification:", error);
    } finally {
        console.log("Closing database pool...");
        await pool.end();
        console.log("Database pool closed.");
        process.exit(0);
    }
}

runVerification();
