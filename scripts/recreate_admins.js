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

const TENANT_ADMIN_EMAIL = 'admin.tenant@gmca.gov';
const ORG_ADMIN_EMAIL = 'admin.org@gmca.gov';
const TENANT_CODE = 'GMCA';
const ORG_CODE = 'GMCA_HO';

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("--- RE-INITIALIZING ADMINS ---");

        // 1. Get IDs
        const tenantRes = await client.query("SELECT tenant_id FROM core.tenants WHERE tenant_code = $1", [TENANT_CODE]);
        const orgRes = await client.query("SELECT organisation_id FROM core.organisations WHERE organisation_code = $1", [ORG_CODE]);
        
        if (tenantRes.rows.length === 0 || orgRes.rows.length === 0) {
            console.error("Master data missing. Run setup scripts first.");
            return;
        }

        const tenantId = tenantRes.rows[0].tenant_id;
        const orgId = orgRes.rows[0].organisation_id;

        // 2. Erase existing associations for these emails
        console.log(`Clearing existing data for ${TENANT_ADMIN_EMAIL} and ${ORG_ADMIN_EMAIL}...`);
        
        // Find user IDs if they exist
        const userRes = await client.query("SELECT id, email FROM auth.users WHERE email IN ($1, $2)", [TENANT_ADMIN_EMAIL, ORG_ADMIN_EMAIL]);
        const userIds = userRes.rows.map(r => r.id);

        if (userIds.length > 0) {
            await client.query("DELETE FROM core.app_users WHERE user_id = ANY($1)", [userIds]);
            await client.query("DELETE FROM public.user_org_roles WHERE user_id = ANY($1)", [userIds]);
            console.log("Previous associations cleared.");
        } else {
            console.log("No existing users found to clear. Ready for new registration.");
        }

        // 3. Prepare roles (if users exist)
        for (const user of userRes.rows) {
            if (user.email === TENANT_ADMIN_EMAIL) {
                console.log(`Setting up ${user.email} as TENANT_ADMIN...`);
                await client.query("UPDATE core.profiles SET role = 'TENANT_ADMIN', tenant_id = $1 WHERE id = $2", [tenantId, user.id]);
                // Link in user_org_roles
                await client.query("INSERT INTO public.user_org_roles (user_id, organisation_id, role) VALUES ($1, $2, 'TENANT_ADMIN') ON CONFLICT DO NOTHING", [user.id, orgId]);
            } else if (user.email === ORG_ADMIN_EMAIL) {
                console.log(`Setting up ${user.email} as ORG_ADMIN...`);
                await client.query("UPDATE core.profiles SET role = 'USER', tenant_id = $1 WHERE id = $2", [tenantId, user.id]);
                // Link in user_org_roles as departmental admin (OR role based on schema)
                await client.query("INSERT INTO public.user_org_roles (user_id, organisation_id, role) VALUES ($1, $2, 'DEPARTMENT_HEAD') ON CONFLICT DO NOTHING", [user.id, orgId]);
            }
        }

        console.log("✅ Operation Complete.");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
