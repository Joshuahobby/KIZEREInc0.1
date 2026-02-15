import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function test() {
    console.log("Testing DB...");
    try {
        const res = await db.execute(sql`SELECT 1 as test`);
        console.log("Result:", res);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

test();
