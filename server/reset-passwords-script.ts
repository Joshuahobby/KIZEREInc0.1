import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./utils/auth-crypto";

async function resetPasswords() {
    console.log("Resetting passwords for admin and subscriber...");
    try {
        const adminHash = await hashPassword("admin123");
        const userHash = await hashPassword("user123");

        // Reset admin (username: admin)
        await db.update(users)
            .set({ password: adminHash })
            .where(eq(users.username, "admin"));
        console.log("✅ Admin password reset to 'admin123'");

        // Reset subscriber (username: user)
        const [existingUser] = await db.select().from(users).where(eq(users.username, "user"));
        if (existingUser) {
            await db.update(users)
                .set({ password: userHash })
                .where(eq(users.username, "user"));
            console.log("✅ Subscriber 'user' password reset to 'user123'");
        } else {
            await db.insert(users).values({
                username: "user",
                password: userHash,
                email: "subscriber@kizere.rw",
                fullName: "Test Subscriber",
                role: "Subscriber",
                verificationStatus: "approved",
                phoneNumber: "+250788000000",
            });
            console.log("✅ Created new subscriber 'user' with password 'user123'");
        }

    } catch (error) {
        console.error("❌ Failed to reset passwords:", error);
    }
}

resetPasswords().then(() => process.exit(0));
