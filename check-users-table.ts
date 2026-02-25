
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkUsersTable() {
    try {
        console.log("Checking 'users' table columns...");
        const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

        const criticalColumns = ['id', 'full_name', 'username', 'email', 'password', 'role', 'status', 'preferences'];
        console.log("Critical Columns Status:");
        criticalColumns.forEach(name => {
            const col = result.rows.find((r: any) => r.column_name === name);
            if (col) {
                console.log(`- ${name}: Found (${col.data_type}, Nullable: ${col.is_nullable})`);
            } else {
                console.log(`- ${name}: MISSING!`);
            }
        });

        console.log("\nAll Columns:");
        result.rows.forEach((r: any) => console.log(`- ${r.column_name} (${r.data_type})`));

        process.exit(0);
    } catch (error) {
        console.error("Error checking 'users' table:", error);
        process.exit(1);
    }
}

checkUsersTable();
