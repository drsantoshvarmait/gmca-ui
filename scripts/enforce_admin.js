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

const TARGET_EMAIL = 'drsantoshvarmait@gmail.com';
const TENANT_CODE = 'GMCA';
const ORG_CODE = 'GMCA_HO';

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log(`--- ENFORCING ADMIN ROLES FOR ${TARGET_EMAIL} ---`);

        // 0. Ensure user_org_roles table exists in public (Compatibility Layer)
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.user_org_roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                organisation_id UUID NOT NULL,
                role TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, organisation_id, role)
            );
            ALTER TABLE public.user_org_roles ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "allow_all" ON public.user_org_roles;
            CREATE POLICY "allow_all" ON public.user_org_roles FOR ALL USING (true);
        `);

        // 1. Get IDs
        const userRes = await client.query("SELECT id FROM auth.users WHERE email = $1", [TARGET_EMAIL]);
        const tenantRes = await client.query("SELECT tenant_id FROM core.tenants WHERE tenant_code = $1", [TENANT_CODE]);
        const orgRes = await client.query("SELECT organisation_id FROM core.organisations WHERE organisation_code = $1", [ORG_CODE]);
        
        // Get Role IDs
        const rolesRes = await client.query("SELECT role_id, role_name FROM core.roles");
        const roles = {};
        rolesRes.rows.forEach(r => roles[r.role_name] = r.role_id);

        if (userRes.rows.length === 0) {
            console.error(`User ${TARGET_EMAIL} not found in auth.users.`);
            return;
        }
        if (tenantRes.rows.length === 0) {
            console.error(`Tenant ${TENANT_CODE} not found.`);
            return;
        }
        if (orgRes.rows.length === 0) {
            console.error(`Organisation ${ORG_CODE} not found.`);
            return;
        }

        const userId = userRes.rows[0].id;
        const tenantId = tenantRes.rows[0].tenant_id;
        const orgId = orgRes.rows[0].organisation_id;

        // 2. Clear stale app_users/user_org_roles for this email
        await client.query("DELETE FROM core.app_users WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM public.user_org_roles WHERE user_id = $1", [userId]);

        // 3. ENFORCE TENANT ADMIN (Jurisdiction Level)
        console.log("Enforcing Tenant Admin role...");
        await client.query("UPDATE core.profiles SET role = 'TENANT_ADMIN', tenant_id = $1 WHERE id = $2", [tenantId, userId]);
        
        await client.query(`
            INSERT INTO core.app_users (user_id, tenant_id, role_id, is_active)
            VALUES ($1, $2, $3, true)
        `, [userId, tenantId, roles['TENANT_ADMIN']]);

        // 4. ENFORCE ORGANISATION ADMIN (Unit Level)
        console.log("Enforcing Organisation Admin role (Org Admin)...");
        await client.query(`
            INSERT INTO public.user_org_roles (user_id, organisation_id, role)
            VALUES ($1, $2, 'ORG_ADMIN')
        `, [userId, orgId]);

        console.log("\n✅ Enforcement Complete.");
        console.log(`User ${TARGET_EMAIL} is now the Admin for Tenant [${TENANT_CODE}] and Organisation [${ORG_CODE}].`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
