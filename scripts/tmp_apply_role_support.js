import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const STAGING_CONFIG = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.risrmpdbvoafowdvnonn',
    password: 'Annuji1*7413',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const PROD_CONFIG = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const migrationSql = fs.readFileSync('supabase/migrations/20260315100000_sop_step_role_support.sql', 'utf8');

async function applyMigration(config, name) {
    const client = new Client(config);
    try {
        console.log(`Applying to ${name}...`);
        await client.connect();
        await client.query(migrationSql);
        console.log(`Successfully applied to ${name}.`);
    } catch (err) {
        console.error(`Failed to apply to ${name}:`, err.message);
    } finally {
        await client.end();
    }
}

async function run() {
    await applyMigration(STAGING_CONFIG, 'STAGING');
    await applyMigration(PROD_CONFIG, 'PRODUCTION');
}

run();
