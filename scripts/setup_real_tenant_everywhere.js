import pkg from 'pg';
const { Client } = pkg;

const STAGING = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.risrmpdbvoafowdvnonn',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const PROD = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function setup(config, name) {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Setting up GMC Ambernath in " + name);
        
        const tenantSql = "INSERT INTO public.tenants (tenant_name, tenant_code, tenant_type, settings) " +
                         "VALUES ($1, $2, $3, $4) " +
                         "ON CONFLICT (tenant_code) DO UPDATE SET tenant_name = EXCLUDED.tenant_name " +
                         "RETURNING tenant_id";
        
        const tenantRes = await client.query(tenantSql, ['GMC Ambernath', 'GMCA', 'GOVERNMENT', JSON.stringify({ brand_color: '#0284c7' })]);
        const tenantId = tenantRes.rows[0].tenant_id;

        const orgSql = "INSERT INTO public.organisations (organisation_name, organisation_code, organisation_type, tenant_id) " +
                      "VALUES ($1, $2, $3, $4) " +
                      "ON CONFLICT (organisation_code) DO UPDATE SET organisation_name = EXCLUDED.organisation_name " +
                      "RETURNING organisation_id";

        const orgRes = await client.query(orgSql, ['GMC Ambernath HO', 'GMCA_HO', 'Administrative Unit', tenantId]);
        const orgId = orgRes.rows[0].organisation_id;

        const userRes = await client.query("SELECT id FROM auth.users WHERE email = 'drsantoshvarmait@gmail.com'");
        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            const roleSql = "INSERT INTO public.user_org_roles (user_id, organisation_id, role) " +
                           "VALUES ($1, $2, 'SUPER_ADMIN') ON CONFLICT DO NOTHING";
            await client.query(roleSql, [userId, orgId]);
            await client.query("UPDATE core.profiles SET tenant_id = $1 WHERE id = $2", [tenantId, userId]);
            console.log("✅ GMC Ambernath established in " + name);
        } else {
            console.log("⚠️ User not found in " + name);
        }

    } catch (err) {
        console.error("❌ Setup error in " + name + ":", err.message);
    } finally {
        await client.end();
    }
}

async function main() {
    await setup(STAGING, 'STAGING');
    await setup(PROD, 'PRODUCTION');
}

main();
