
import { db } from "../server/db";
import { payments } from "../shared/schema";
import { sql } from "drizzle-orm";

async function checkDb() {
  try {
    console.log("Checking database connection...");
    const result = await db.execute(sql`SELECT count(*) FROM payments`);
    console.log("Payments table count:", result.rows[0]);
    console.log("Database check passed!");
    process.exit(0);
  } catch (error) {
    console.error("Database check failed:", error);
    process.exit(1);
  }
}

checkDb();
