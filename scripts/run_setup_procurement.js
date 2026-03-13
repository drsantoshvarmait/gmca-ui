import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

async function runSqlFile(filePath, client) {
    console.log(`Executing SQL from ${path.basename(filePath)}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split by common separators if needed (but most of our files can run as one block if they handle their own DO blocks etc)
    // Actually, pg client can run a big block if it doesn't contain multiple commands that need separate execution?
    // Usually, multiple statements are fine if they are ';' separated and no weirdness.
    try {
        await client.query(sql);
        console.log(`✅ Success: ${path.basename(filePath)}`);
    } catch (err) {
        console.error(`❌ Error in ${path.basename(filePath)}:`, err.message);
        throw err;
    }
}

async function main() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Run setup and seed in order
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
