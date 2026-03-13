import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function findTables() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        const { rows } = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name ILIKE '%uom%' OR table_name ILIKE '%unit%')");
        console.log("UOM/Unit tables:", rows.map(r => r.table_name));
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
findTables();
