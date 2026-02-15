import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { config } from "../config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    if (!config.DATABASE_URL) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    console.log("⏳ Running database migrations...");

    const migrationClient = postgres(config.DATABASE_URL, { max: 1 });
    const db = drizzle(migrationClient);

    try {
        await migrate(db, {
            migrationsFolder: path.join(__dirname, "../../drizzle"),
        });
        console.log("✅ Migrations completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

runMigration();
