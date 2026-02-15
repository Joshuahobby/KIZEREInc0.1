
import { storage } from "../server/storage";
import { hashPassword } from "../server/utils/auth-crypto";
import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function runVerification() {
    console.log("🚀 Starting Payment Flow Verification (Mock Mode)...");

    // Force mock mode
    process.env.MOCK_PAYMENTS = 'true';
    process.env.FLUTTERWAVE_SECRET_KEY = 'mock_secret_key';
    process.env.FLUTTERWAVE_PUBLIC_KEY = 'mock_public_key';

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

        // 2. Mock Payment Initialization
        // We can't easily call the API route via 'fetch' here because we'd need the server running and auth cookie.
        // Instead, we'll verify the UTILS directly, which the route uses.

        console.log("Testing initializePayment utility...");
        const { initializePayment, verifyTransaction, generateTransactionReference } = await import("../server/utils/flutterwave");

        const txRef = generateTransactionReference();
        const initResponse = await initializePayment({
            amount: 5000,
            currency: 'RWF',
            tx_ref: txRef,
            redirect_url: 'http://localhost:5000/callback',
            customer: {
                email: user.email,
                name: user.fullName,
            }
        });

        if (initResponse.status === 'success' && initResponse.data?.link) {
            console.log("✅ Payment initialization successful (Mock).");
            console.log(`   - Link: ${initResponse.data.link}`);
        } else {
            console.error("❌ Payment initialization failed.");
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
            transactionRef: txRef,
            metadata: { plan: "Standard" }
        });
        console.log(`✅ Payment record created: ${payment.id} (Status: ${payment.status})`);

        // 4. Simulate Webhook / Verification
        console.log("Testing verifyTransaction utility...");
        // In a real flow, Flutterwave sends a webhook or we verify manually.
        // Let's simulate verifying the transaction ID that would come back.

        const verificationResponse = await verifyTransaction(txRef); // Passing txRef as ID for mock logic

        if (verificationResponse.status === 'success' && verificationResponse.data.status === 'successful') {
            console.log("✅ Transaction verification successful (Mock).");
        } else {
            console.error("❌ Transaction verification failed.");
            process.exit(1);
        }

        // 5. Update Payment Status (simulating route logic)
        console.log("Updating payment status to 'completed'...");
        const updatedPayment = await storage.updatePayment(payment.id, {
            status: 'completed',
            transactionId: verificationResponse.data.id.toString(),
            flutterwaveRef: verificationResponse.data.flw_ref
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
