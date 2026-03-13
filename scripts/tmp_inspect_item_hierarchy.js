import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function inspectItemHierarchy() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Item Types ---");
        const { rows: types } = await client.query("SELECT * FROM public.item_types LIMIT 10");
        console.log(types);

        console.log("\n--- Item Categories ---");
        const { rows: categories } = await client.query("SELECT * FROM public.item_categories LIMIT 10");
        console.log(categories);

        console.log("\n--- Item Table Hierarchy Columns ---");
        const { rows: columns } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'items' AND table_schema = 'public'");
        console.log(columns.map(c => c.column_name));

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
inspectItemHierarchy();
