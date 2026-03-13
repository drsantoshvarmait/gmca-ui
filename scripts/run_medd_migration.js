import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function runMigration() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/migrate_medd_marathi.sql', 'utf8');
        await client.query(sql);
        console.log("✅ MEDD Marathi Migration Successful");

        // Verification query
        const { rows } = await client.query("SELECT account_name, local_account_name FROM public.fin_coa WHERE tenant_id = '58f443c8-4bd5-46be-9471-3de6abeca27e' LIMIT 5");
        console.log("Sample localized CoA for MEDD:", rows);

    } catch (err) {
        console.error("MIGRATION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
runMigration();
