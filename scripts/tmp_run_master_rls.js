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

const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/migrations/20260311093000_master_units_rls.sql', 'utf8');

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Applying RLS to Master Units...');
        await client.query(sql);
        console.log('RLS Applied.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
