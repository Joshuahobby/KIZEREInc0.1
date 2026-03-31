import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id TEXT UNIQUE;');
    console.log('Successfully added national_id column to users table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS retailers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        api_key TEXT NOT NULL UNIQUE,
        subscription_plan TEXT NOT NULL DEFAULT 'basic',
        status TEXT NOT NULL DEFAULT 'active',
        user_id INTEGER NOT NULL REFERENCES users(id),
        logo_url TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Successfully created retailers table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_products (
        id SERIAL PRIMARY KEY,
        sku TEXT,
        serial_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Other',
        retailer_id INTEGER NOT NULL REFERENCES retailers(id),
        current_owner_id INTEGER NOT NULL REFERENCES users(id),
        registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'registered',
        metadata JSONB
      );
    `);
    console.log('Successfully created pos_products table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ownership_ledger (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES pos_products(id),
        from_user_id INTEGER REFERENCES users(id),
        to_user_id INTEGER NOT NULL REFERENCES users(id),
        registered_by INTEGER NOT NULL REFERENCES retailers(id),
        event TEXT NOT NULL DEFAULT 'sale',
        notes TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Successfully created ownership_ledger table');

    console.log('All POS schema changes applied successfully');
  } catch (err) {
    console.error('Error executing queries', err);
  } finally {
    await pool.end();
  }
}

main();
