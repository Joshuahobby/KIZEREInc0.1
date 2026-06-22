
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function fixSchema() {
  console.log('Checking database schema and applying fixes...');

  try {
    // 1. Fix verification_requests table
    console.log('Applying fixes to verification_requests table...');
    
    // Add document_public_id
    try {
      await sql`ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS document_public_id text;`;
      console.log('  - document_public_id column added or already exists');
    } catch (e) {
      console.log('  - Error adding document_public_id:', e.message);
    }

    // Add selfie_public_id
    try {
      await sql`ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS selfie_public_id text;`;
      console.log('  - selfie_public_id column added or already exists');
    } catch (e) {
      console.log('  - Error adding selfie_public_id:', e.message);
    }

    // Add liveness_code
    try {
      await sql`ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS liveness_code text;`;
      console.log('  - liveness_code column added or already exists');
    } catch (e) {
      console.log('  - Error adding liveness_code:', e.message);
    }

    // 2. Fix payments table (rename flutterwave_ref to provider_ref if needed)
    console.log('Applying fixes to payments table...');
    try {
      // Check if provider_ref exists
      const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_ref';`;
      
      if (columns.length === 0) {
        // provider_ref doesn't exist, check if flutterwave_ref exists to rename it
        const oldColumns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'flutterwave_ref';`;
        
        if (oldColumns.length > 0) {
          await sql`ALTER TABLE payments RENAME COLUMN flutterwave_ref TO provider_ref;`;
          console.log('  - Renamed flutterwave_ref to provider_ref');
        } else {
          await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_ref text;`;
          console.log('  - provider_ref column added');
        }
      } else {
        console.log('  - provider_ref column already exists');
      }
    } catch (e) {
      console.log('  - Error fixing payments table:', e.message);
    }

    console.log('Schema fixes completed successfully!');
  } catch (error) {
    console.error('Error applying schema fixes:', error);
    process.exit(1);
  }
}

fixSchema();
