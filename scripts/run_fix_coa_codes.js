import pkg from 'pg';
import fs from 'fs';

const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function runFix() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("Fixing Chart of Accounts Codes...");
        const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/fix_coa_codes.sql', 'utf8');
        await client.query(sql);
        console.log("✅ Success: All codes generated correctly with bilingual names!");
    } catch (err) {
        console.error("FIX ERROR:", err.message);
    } finally {
        await client.end();
    }
}
runFix();
