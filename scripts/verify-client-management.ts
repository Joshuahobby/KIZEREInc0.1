
import { storage } from "../server/storage";
import { hashPassword } from "../server/utils/auth-crypto";
import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";
import { paymentTypes } from "@shared/schema";

async function runVerification() {
    console.log("🚀 Starting Client Management Backend Verification...");

    try {
        // Test DB Connection
        console.log("Testing database connection...");
        await db.execute(sql`SELECT 1`);
        console.log("✅ Database connection successful.");

        const timestamp = Date.now();
        const password = await hashPassword("password123");

        // 1. Create a Business User
        console.log("Creating Business User...");
        const businessUser = await storage.createUser({
            fullName: "Test Business Inc.",
            username: `biz-user-${timestamp}`,
            email: `biz-${timestamp}@example.com`,
            password,
            role: "Business",
            preferences: {}
        });
        console.log(`✅ Business User created: ${businessUser.id} (${businessUser.username})`);

        // 2. Verify we can fetch them by role
        console.log("Fetching users with role 'Business'...");
        const { users } = await storage.getUsersWithFilters({ role: "Business", page: 1, pageSize: 10 });
        const found = users.find(u => u.id === businessUser.id);

        if (found) {
            console.log("✅ Verified: Business user found in filtered list.");
        } else {
            console.error("❌ Failed: Business user NOT found in filtered list.");
            process.exit(1);
        }

        // 3. Create a Payment for this user
        console.log("Creating payment record...");
        const payment = await storage.createPayment({
            userId: businessUser.id,
            amount: "50000",
            currency: "RWF",
            type: "registration",
            status: "successful",
            transactionRef: `tx_${timestamp}`,
            metadata: { plan: "Gold" }
        });
        console.log(`✅ Payment created: ${payment.id}`);

        // 4. Verify getUserPayments returns this payment
        console.log(`Fetching payments for user ${businessUser.id}...`);
        const userPayments = await storage.getUserPayments(businessUser.id);
        const foundPayment = userPayments.find(p => p.id === payment.id);

        if (foundPayment) {
            console.log("✅ Verified: Payment record found for user.");
            console.log(`   - Amount: ${foundPayment.amount} ${foundPayment.currency}`);
            console.log(`   - Status: ${foundPayment.status}`);
        } else {
            console.error("❌ Failed: Payment record NOT found for user.");
            process.exit(1);
        }

        console.log("🎉 Client Management Backend Logic Verified Successfully!");

    } catch (error) {
        console.error("❌ Error during verification:", error);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runVerification();
