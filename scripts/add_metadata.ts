import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Adding metadata to ownership_ledger...");
    await db.execute(sql`ALTER TABLE ownership_ledger ADD COLUMN IF NOT EXISTS metadata json;`);
    
    // Check if kizere_id exists, if not, add it.
    console.log("Adding kizere_id to pos_products...");
    await db.execute(sql`ALTER TABLE pos_products ADD COLUMN IF NOT EXISTS kizere_id text;`);
    
    // Backfill kizere_id
    await db.execute(sql`UPDATE pos_products SET kizere_id = gen_random_uuid()::text WHERE kizere_id IS NULL;`);
    
    // Make it not null and unique
    await db.execute(sql`ALTER TABLE pos_products ALTER COLUMN kizere_id SET NOT NULL;`);
    
    // Try to add unique constraint (might fail if already exists but just in case)
    await db.execute(sql`ALTER TABLE pos_products ADD CONSTRAINT pos_product_kizere_id_idx UNIQUE (kizere_id);`).catch(() => {});
    
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

run();
