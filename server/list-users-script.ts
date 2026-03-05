import { db } from "../server/db";
import { users } from "../shared/schema";

async function listUsers() {
    console.log("Listing users in database...");
    try {
        const allUsers = await db.select().from(users);
        console.log("Found " + allUsers.length + " users:");
        allUsers.forEach(u => {
            console.log(`- ID: ${u.id}, Username: ${u.username}, Role: ${u.role}, Email: ${u.email}`);
        });
    } catch (error) {
        console.error("❌ Failed to list users:", error);
    }
}

listUsers().then(() => process.exit(0));
