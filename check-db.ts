
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkDb() {
  try {
    console.log("Checking database...");
    
    // Check if table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_action_logs'
      );
    `);
    
    console.log("Table 'admin_action_logs' exists:", result.rows[0].exists);
    
    if (result.rows[0].exists) {
        const count = await db.execute(sql`SELECT count(*) FROM admin_action_logs`);
        console.log("Row count:", count.rows[0].count);

        // Check columns
        const columns = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'admin_action_logs'
        `);
        console.log("Current columns:", columns.rows.map((c: any) => c.column_name).join(', '));

        const requiredColumns = [
            { name: 'details', type: 'text' },
            { name: 'entity_type', type: 'text' },
            { name: 'entity_id', type: 'integer' },
            { name: 'previous_state', type: 'json' },
            { name: 'new_state', type: 'json' },
            { name: 'reason', type: 'text' },
            { name: 'target_user_id', type: 'integer' }
        ];

        for (const col of requiredColumns) {
            const exists = columns.rows.some((c: any) => c.column_name === col.name);
            if (!exists) {
                console.log(`Adding missing column: ${col.name}`);
                try {
                    await db.execute(sql.raw(`ALTER TABLE admin_action_logs ADD COLUMN ${col.name} ${col.type}`));
                    console.log(`Added ${col.name}`);
                } catch (err) {
                    console.error(`Failed to add ${col.name}:`, err);
                }
            }
        }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking DB:", error);
    process.exit(1);
  }
}

checkDb();
