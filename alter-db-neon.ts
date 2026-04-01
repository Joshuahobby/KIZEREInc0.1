import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!);

async function main() {
  try {
    console.log("Adding national_id to users...");
    const res = await sql('ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id TEXT UNIQUE;');
    console.log('Successfully added national_id column to users table', res);
  } catch (err) {
    console.error('Error executing query', err);
  }
}

main();
