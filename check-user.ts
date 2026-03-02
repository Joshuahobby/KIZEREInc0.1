import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkUser() {
    try {
        const result = await db.select().from(users).where(eq(users.username, "test@kizere.rw"));
        if (result.length > 0) {
            console.log("HASH_HEX_LENGTH:" + result[0].password.length);
            console.log("FULL_HASH_HEX:" + result[0].password);
        } else {
            console.log("User not found");
        }
    } catch (err) {
        process.exit(1);
    }
    process.exit(0);
}

checkUser();
