import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function runEnumUpdate() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("Applying Item Category ENUM...");
        const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/item_category_enum.sql', 'utf8');
        await client.query(sql);
        console.log("✅ Success: Item Categories converted to ENUM!");

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
runEnumUpdate();
