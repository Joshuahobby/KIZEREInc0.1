import 'dotenv/config';
import postgres from 'postgres';

async function testConnection() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    console.log('Testing connection to:', url.split('@')[1]); // Don't log password

    try {
        const sql = postgres(url, { ssl: 'require' });
        const result = await sql`SELECT 1 as connected`;
        console.log('Successfully connected to database:', result);
        await sql.end();
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
}

testConnection();
