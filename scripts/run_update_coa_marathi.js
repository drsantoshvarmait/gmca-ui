import pkg from 'pg';
import fs from 'fs';

const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function runSQL() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("Applying Bilingual Update to CoA...");
        const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/update_coa_marathi.sql', 'utf8');
        await client.query(sql);
        console.log("✅ Success: Marathi heads injected and linked!");
    } catch (err) {
        console.error("MIGRATION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
runSQL();
