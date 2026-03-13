import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/migrations/20260311091000_org_type_units_junction.sql', 'utf8');

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Running migration for Org Type Units junction...');
        await client.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
