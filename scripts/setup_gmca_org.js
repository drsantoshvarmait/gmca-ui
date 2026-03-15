import pkg from 'pg';
const { Client } = pkg;

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.aaritujhokbxezuxcqnm',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Setting up default organization for GMCA...");
        
        // 1. Get GMCA tenant_id
        const tenantRes = await client.query("SELECT tenant_id FROM core.tenants WHERE tenant_code = 'GMCA'");
        if (tenantRes.rows.length === 0) {
            console.error("GMCA tenant not found.");
            return;
        }
        const tenantId = tenantRes.rows[0].tenant_id;

        // 2. Clear existing orgs for this tenant to be safe
        // await client.query("DELETE FROM public.organisations WHERE tenant_id = $1", [tenantId]);

        // 3. Create Default Organization Type if missing
        const typeRes = await client.query("INSERT INTO public.organisation_types (organisation_type) VALUES ('Administrative Unit') ON CONFLICT (organisation_type) DO UPDATE SET organisation_type = EXCLUDED.organisation_type RETURNING organisation_type_id");
        const typeId = typeRes.rows[0].organisation_type_id;

        // 4. Create "GMC Ambernath HO" Organization
        const orgRes = await client.query(`
            INSERT INTO public.organisations (organisation_name, organisation_code, organisation_type, organisation_type_id, tenant_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (organisation_code) DO UPDATE SET organisation_name = EXCLUDED.organisation_name
            RETURNING organisation_id
        `, ['GMC Ambernath HO', 'GMCA_HO', 'Administrative Unit', typeId, tenantId]);
        const orgId = orgRes.rows[0].organisation_id;
        console.log(`✅ Organization created: ${orgId}`);

        // 5. Get User ID
        const userRes = await client.query("SELECT id FROM auth.users WHERE email = 'drsantoshvarmait@gmail.com'");
        if (userRes.rows.length === 0) {
            console.error("User not found.");
            return;
        }
        const userId = userRes.rows[0].id;

        // 6. Link User in user_org_roles
        await client.query(`
            INSERT INTO public.user_org_roles (user_id, organisation_id, role)
            VALUES ($1, $2, 'SUPER_ADMIN')
            ON CONFLICT DO NOTHING
        `, [userId, orgId]);
        console.log("✅ User linked to organization.");

        // 7. Update profile tenant_id
        await client.query("UPDATE core.profiles SET tenant_id = $1 WHERE id = $2", [tenantId, userId]);
        console.log("✅ Profile tenant_id updated.");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
