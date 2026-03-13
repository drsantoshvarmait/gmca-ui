import pkg from 'pg';
import fs from 'fs';

const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function runSQL() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("Defining dynamic localization settings for Maharashtra Governments...");
        await client.query(`
            UPDATE public.tenants 
            SET secondary_language_code = 'mr' 
            WHERE tenant_name LIKE '%GMCA%' OR tenant_name LIKE '%Medical Education%';
        `);

        const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/dynamic_localization.sql', 'utf8');
        await client.query(sql);
        console.log("✅ Success: System modernized for dynamic localization and granular tracking!");
    } catch (err) {
        console.error("MIGRATION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
runSQL();
