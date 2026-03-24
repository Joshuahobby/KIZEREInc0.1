import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_gwY2TeztH8Rb@ep-late-sunset-aiji18q0-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, username, full_name, role, verification_status FROM users LIMIT 20');
    console.table(res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
