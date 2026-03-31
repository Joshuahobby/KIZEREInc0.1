import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

if (!process.env.DATABASE_URL_UNPOOLED) {
  console.error('DATABASE_URL_UNPOOLED not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSql = readFileSync('migrations/0002_dry_queen_noir.sql', 'utf-8');
    
    // Split by statement-breakpoint
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await sql(stmt);
        const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
        console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
      } catch (err: any) {
        if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
          console.log(`[${i + 1}/${statements.length}] SKIP: Already exists`);
        } else {
          console.error(`[${i + 1}/${statements.length}] ERROR:`, err.message);
        }
      }
    }
    
    console.log('\nMigration completed successfully!');
  } catch (err: any) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

applyMigration();
