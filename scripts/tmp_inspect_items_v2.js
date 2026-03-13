import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function inspectItems() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Searching for Item Master tables ---");
        const { rows: tables } = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%item%'");
        console.log("Tables:", tables.map(t => t.table_name));

        console.log("\n--- Checking Tenant Types ---");
        const { rows: tenants } = await client.query("SELECT tenant_id, tenant_name, tenant_code FROM public.tenants LIMIT 5");
        console.log("Tenants:", tenants);

        // Check if tenants table has a type or category column
        const { rows: columns } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants' AND table_schema = 'public'");
        console.log("Tenant columns:", columns.map(c => c.column_name));

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
inspectItems();
