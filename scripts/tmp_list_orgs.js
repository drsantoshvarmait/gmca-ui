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

async function checkOrgsDetailed() {
    const client = new Client(config);
    try {
        await client.connect();

        console.log("--- All Tenants ---");
        const tenantsRes = await client.query(`SELECT tenant_id, tenant_name, tenant_code FROM public.tenants`);
        console.log(JSON.stringify(tenantsRes.rows, null, 2));

        console.log("\n--- All Organizations with Tenant ---");
        const res = await client.query(`
        SELECT organisation_id, organisation_name, organisation_code, tenant_id FROM public.organisations ORDER BY created_at DESC LIMIT 20
    `);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkOrgsDetailed();
