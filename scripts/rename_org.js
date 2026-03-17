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

const TENANT_CODE = 'MEDD';
const NEW_ORG_NAME = 'GMC Ambernath';
const NEW_ORG_CODE = 'GMCA';

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log(`--- UPDATING ORGANISATION TO ${NEW_ORG_CODE} UNDER TENANT ${TENANT_CODE} ---`);

        // 1. Get Tenant ID
        const tenantRes = await client.query("SELECT tenant_id FROM core.tenants WHERE tenant_code = $1", [TENANT_CODE]);
        if (tenantRes.rows.length === 0) {
            console.error(`Tenant ${TENANT_CODE} not found.`);
            return;
        }
        const tenantId = tenantRes.rows[0].tenant_id;

        // 2. Update Core Organisations
        const coreRes = await client.query(`
            UPDATE core.organisations 
            SET organisation_name = $1, organisation_code = $2 
            WHERE tenant_id = $3
            RETURNING *
        `, [NEW_ORG_NAME, NEW_ORG_CODE, tenantId]);

        if (coreRes.rows.length > 0) {
            console.log("✅ Updated core.organisations");
        } else {
            console.log("⚠️ No organisations found for this tenant in core.organisations");
        }

        // 3. Update Public Organisations (if table exists)
        try {
            const publicRes = await client.query(`
                UPDATE public.organisations 
                SET organisation_name = $1, organisation_code = $2 
                WHERE tenant_id = $3
                RETURNING *
            `, [NEW_ORG_NAME, NEW_ORG_CODE, tenantId]);

            if (publicRes.rows.length > 0) {
                console.log("✅ Updated public.organisations");
            }
        } catch (e) {
            // Table might not exist in public, ignore
        }

        console.log("\n✅ Transformation Complete.");
        console.log(`Tenant: ${TENANT_CODE} (Medical Education and Drug Department)`);
        console.log(`Primary Organisation: ${NEW_ORG_CODE} (${NEW_ORG_NAME})`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
