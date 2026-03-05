import { db } from "../server/db";
import { users } from "../shared/schema";
import { hashPassword } from "../server/utils/auth-crypto";

async function createAgent() {
    console.log("Creating Agent user...");
    const hashedAgentPassword = await hashPassword("agent123");

    try {
        const [agentUser] = await db.insert(users).values({
            username: "agent",
            password: hashedAgentPassword,
            email: "agent@kizere.com",
            fullName: "Test Agent",
            role: "Agent",
            verificationStatus: "approved",
            phoneNumber: "+250788111222",
        }).onConflictDoUpdate({
            target: users.username,
            set: { role: "Agent", password: hashedAgentPassword, verificationStatus: "approved" }
        }).returning();

        console.log("✅ Agent user created/updated:", agentUser.username);
    } catch (error) {
        console.error("❌ Failed to create Agent:", error);
    }
}

createAgent().then(() => process.exit(0));
