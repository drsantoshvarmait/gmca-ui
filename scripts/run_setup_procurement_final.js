import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pkg;

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com', // AWS-1 instead of AWS-0
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function runSqlFile(filePath, client) {
    console.log(`Executing SQL from ${path.basename(filePath)}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
        await client.query(sql);
        console.log(`✅ Success: ${path.basename(filePath)}`);
    } catch (err) {
        console.error(`❌ Error in ${path.basename(filePath)}:`, err.message);
        throw err;
    }
}

async function main() {
    const client = new Client(config);
    try {
        console.log("Connecting to Supabase (AWS-1 pooler)...");
        await client.connect();

        await runSqlFile('c:/Users/91932/gmca-ui/supabase/setup_procurement.sql', client);
        await runSqlFile('c:/Users/91932/gmca-ui/supabase/seed_authentic_coa.sql', client);

        console.log("\n🚀 DATABASE SETUP & AUTHENTIC COA SEEDING COMPLETE!");
    } catch (err) {
        console.error("FATAL ERROR:", err.message);
    } finally {
        await client.end();
    }
}

main();
