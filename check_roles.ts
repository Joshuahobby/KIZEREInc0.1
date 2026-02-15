
import { db } from "./server/db";
import { roles } from "./shared/schema";

async function checkRoles() {
    const allRoles = await db.select().from(roles);
    console.log("Current Roles in DB:", JSON.stringify(allRoles, null, 2));
    process.exit(0);
}

checkRoles().catch(console.error);
