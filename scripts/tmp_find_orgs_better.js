import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function findOrgs() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Searching for Organization Tables ---");
        const { rows: tables } = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%org%'");
        console.log("Tables found:", tables);

        const meddTenantId = '58f443c8-4bd5-46be-9471-3de6abeca27e';
        
        for (const table of tables) {
            try {
                const { rows: sample } = await client.query(`SELECT * FROM ${table.table_schema}.${table.table_name} WHERE tenant_id = '${meddTenantId}' LIMIT 5`);
                if (sample.length > 0) {
                    console.log(`\nTable ${table.table_schema}.${table.table_name} has MEDD organizations:`, sample);
                }
            } catch (e) {
                // Skip tables that don't have tenant_id
            }
        }

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
findOrgs();
