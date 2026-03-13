import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function inspectMEDD() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    try {
        console.log("--- Finding MEDD Tenant ---");
        const { rows: tenants } = await client.query("SELECT tenant_id, tenant_code, tenant_name, secondary_language_code FROM public.tenants WHERE tenant_code = 'MEDD' OR tenant_name LIKE '%Medical Education%'");
        console.log("Tenants found:", tenants);

        if (tenants.length > 0) {
            const tenantIds = tenants.map(t => `'${t.tenant_id}'`).join(',');
            console.log("\n--- Finding Organizations for these Tenants ---");
            const { rows: orgs } = await client.query(`SELECT organization_id, tenant_id, organization_name FROM public.organizations WHERE tenant_id IN (${tenantIds})`);
            console.log(`Found ${orgs.length} organizations.`);
            orgs.forEach(o => console.log(` - ${o.organization_name} (ID: ${o.organization_id})`));
        }

    } catch (err) {
        console.error("INSPECTION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
inspectMEDD();
