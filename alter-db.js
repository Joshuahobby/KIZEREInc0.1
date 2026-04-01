const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
});

async function main() {
  try {
    const res = await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id TEXT UNIQUE;');
    console.log('Successfully added national_id column to users table', res);
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await pool.end();
  }
}

main();
