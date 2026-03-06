
import { storage } from "../server/storage";
import { hashPassword } from "../server/utils/auth-crypto";
import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

import { config } from "../server/config";

async function runVerification() {
    const mode = config.MOCK_PAYMENTS ? "Mock" : "Real (Sandbox/Prod)";
    console.log(`🚀 Starting Payment Flow Verification (${mode} Mode)...`);

    if (!config.PAWAPAY_API_TOKEN && !config.MOCK_PAYMENTS) {
        console.error("❌ PAWAPAY_API_TOKEN is missing and MOCK_PAYMENTS is false.");
        process.exit(1);
    }

    try {
        // Test DB Connection
        console.log("Testing database connection...");
        await db.execute(sql`SELECT 1`);
        console.log("✅ Database connection successful.");

        const timestamp = Date.now();
        const password = await hashPassword("password123");

        // 1. Create a Test User
        console.log("Creating Test User for Payment...");
        const user = await storage.createUser({
            fullName: "Payment Tester",
            username: `payer-${timestamp}`,
            email: `payer-${timestamp}@example.com`,
            password,
            role: "Subscriber",
            preferences: {}
        });
        console.log(`✅ User created: ${user.id} (${user.username})`);

        // 2. Mock Payment Initialization via PawaPay Direct Deposit
        console.log("Testing initiateDeposit utility...");
        const { initiateDeposit, checkDepositStatus, generateDepositId } = await import("../server/utils/pawapay");

        const depositId = generateDepositId();
        const initResponse = await initiateDeposit({
            amount: 5000,
            currency: 'RWF',
            depositId,
            phoneNumber: '250780000000',
            provider: 'MTN_MOMO_RWA',
        });

        if (initResponse.status === 'ACCEPTED') {
            console.log("✅ Deposit initiation successful (Mock).");
            console.log(`   - Deposit ID: ${initResponse.depositId}`);
        } else {
            console.error("❌ Deposit initiation failed.");
            process.exit(1);
        }

        // 3. Create a pending payment record (simulating what the route does)
        console.log("Creating pending payment record in DB...");
        const payment = await storage.createPayment({
            userId: user.id,
            amount: "5000",
            currency: "RWF",
            type: "registration",
            status: "pending",
            transactionRef: depositId,
            metadata: { plan: "Standard" }
        });
        console.log(`✅ Payment record created: ${payment.id} (Status: ${payment.status})`);

        // 4. Check deposit status (mock)
        console.log("Testing checkDepositStatus utility...");
        const statusResponse = await checkDepositStatus(depositId);

        if (statusResponse.status === 'COMPLETED') {
            console.log("✅ Deposit status check successful (Mock).");
        } else {
            console.error("❌ Deposit status check failed.");
            process.exit(1);
        }

        // 5. Update Payment Status (simulating route logic)
        console.log("Updating payment status to 'completed'...");
        const updatedPayment = await storage.updatePayment(payment.id, {
            status: 'completed',
            transactionId: statusResponse.depositId,
            providerRef: statusResponse.providerTransactionId || null
        });

        if (updatedPayment?.status === 'completed') {
            console.log("✅ Payment status updated to 'completed'.");
        } else {
            console.error("❌ Failed to update payment status.");
            process.exit(1);
        }

        console.log("🎉 Payment Flow Verification Successful!");

    } catch (error) {
        console.error("❌ Error during verification:", error);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runVerification();
