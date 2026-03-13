import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function inspectTenants() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Checking table existence (tenants) ---");
        const { rows: tableCheck } = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'tenants'");
        console.log("Table check:", tableCheck);

        if (tableCheck.length > 0) {
            const schema = tableCheck[0].table_schema;
            const { rows: columns } = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants' AND table_schema = '${schema}'`);
            console.log(`Columns (${schema}.tenants):`, columns);
            
            const { rows: data } = await client.query(`SELECT * FROM ${schema}.tenants LIMIT 5`);
            console.log(`Sample Data (${schema}.tenants):`, data);
        }

    } catch (err) {
        console.error("INSPECTION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
inspectTenants();
