import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function inspectItemsTable() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Checking public.items structure ---");
        const { rows: columns } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items' AND table_schema = 'public'");
        console.log("Columns:", columns);

        console.log("\n--- Checking Sample Data ---");
        const { rows: data } = await client.query("SELECT * FROM public.items LIMIT 5");
        console.log("Data:", data);

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
inspectItemsTable();
