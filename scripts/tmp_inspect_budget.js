import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function inspectBudgetHeads() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        console.log("--- Inspecting budget_heads ---");
        const { rows: columnsBH } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'budget_heads'");
        console.log("Columns:", columnsBH);
        const { rows: dataBH } = await client.query("SELECT * FROM public.budget_heads LIMIT 5");
        console.log("Sample Data:", dataBH);

        console.log("\n--- Inspecting budget_sub_heads ---");
        const { rows: columnsBSH } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'budget_sub_heads'");
        console.log("Columns:", columnsBSH);
        const { rows: dataBSH } = await client.query("SELECT * FROM public.budget_sub_heads LIMIT 5");
        console.log("Sample Data:", dataBSH);

    } catch (err) {
        console.error("INSPECTION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
inspectBudgetHeads();
