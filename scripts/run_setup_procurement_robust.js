import pkg from 'pg';
import fs from 'fs';

const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function runSQL(client, label, sql) {
    console.log(`Executing: ${label}...`);
    try {
        await client.query(sql);
        console.log(`✅ Success`);
    } catch (err) {
        console.error(`❌ Error in ${label}:`, err.message);
        throw err;
    }
}

async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        const setupSql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/setup_procurement.sql', 'utf8');
        const seedSql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/seed_authentic_coa.sql', 'utf8');

        // Split setupSql into smaller chunks if it contains multiple logical parts or just run as is
        // Robustness: Split by CREATE TABLE or similar if the pg client struggles with huge blocks
        await runSQL(client, "Public Prefixed Setup", setupSql);
        await runSQL(client, "Authentic CAG Seeding", seedSql);

        console.log("\n🚀 DATABASE MIGRATION TO PUBLIC SCHEMA COMPLETE!");
    } catch (err) {
        console.error("FATAL ERROR:", err.message);
    } finally {
        await client.end();
    }
}
run();
