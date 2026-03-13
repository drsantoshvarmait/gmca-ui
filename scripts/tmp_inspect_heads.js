import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function inspectUserHeads() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        console.log("--- Inspecting public.object_heads ---");
        const { rows: columnsOH } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'object_heads'");
        console.log("Columns:", columnsOH);
        const { rows: dataOH } = await client.query("SELECT * FROM public.object_heads LIMIT 5");
        console.log("Sample Data:", dataOH);

        console.log("\n--- Inspecting public.object_heads_subobjective ---");
        const { rows: columnsOHS } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'object_heads_subobjective'");
        console.log("Columns:", columnsOHS);
        const { rows: dataOHS } = await client.query("SELECT * FROM public.object_heads_subobjective LIMIT 5");
        console.log("Sample Data:", dataOHS);

    } catch (err) {
        console.error("INSPECTION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
inspectUserHeads();
