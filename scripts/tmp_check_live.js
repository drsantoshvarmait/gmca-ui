import pkg from 'pg';
const { Client } = pkg;

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const client = new Client(config);

async function checkLiveEntities() {
    try {
        await client.connect();

        console.log("--- Checking Tenants ---");
        const tenants = await client.query("SELECT tenant_id, tenant_name, tenant_code, status FROM public.tenants WHERE tenant_code = 'MEDD'");
        console.log(JSON.stringify(tenants.rows, null, 2));

        console.log("\n--- Checking Organisations ---");
        const orgs = await client.query("SELECT organisation_id, organisation_name, organisation_code, tenant_id FROM public.organisations WHERE organisation_code = 'GMCA'");
        console.log(JSON.stringify(orgs.rows, null, 2));

    } catch (err) {
        console.error("Check failed:", err.message);
    } finally {
        await client.end();
    }
}

checkLiveEntities();
