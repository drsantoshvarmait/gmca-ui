import pkg from 'pg';
const { Client } = pkg;

const PROD_CONFIG = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function findDesignations() {
    const client = new Client(PROD_CONFIG);
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'designations'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

findDesignations();
