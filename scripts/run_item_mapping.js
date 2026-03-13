import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function runItemMapping() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("Applying Item Master Gov Mapping...");
        const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/item_master_gov_mapping.sql', 'utf8');
        await client.query(sql);
        console.log("✅ Success: Item Master enhanced for Government tenants!");

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
runItemMapping();
