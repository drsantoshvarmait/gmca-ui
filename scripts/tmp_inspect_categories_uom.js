import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function inspectTables() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- item_categories ---");
        const { rows: cats } = await client.query("SELECT * FROM public.item_categories LIMIT 5");
        console.log(cats);

        console.log("\n--- items table current structure ---");
        const { rows: cols } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items'");
        console.log(cols.filter(c => c.column_name.includes('category') || c.column_name.includes('unit')));

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
inspectTables();
