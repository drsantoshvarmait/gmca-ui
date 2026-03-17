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

const OLD_CODE = 'GMCA';
const NEW_CODE = 'MEDD';
const NEW_NAME = 'Medical Education and Drug Department';

async function main() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log(`--- RENAMING TENANT ${OLD_CODE} TO ${NEW_CODE} ---`);

        // 1. Update Core Tenants
        const coreRes = await client.query(`
            UPDATE core.tenants 
            SET tenant_name = $1, tenant_code = $2 
            WHERE tenant_code = $3
            RETURNING *
        `, [NEW_NAME, NEW_CODE, OLD_CODE]);

        if (coreRes.rows.length > 0) {
            console.log("✅ Updated core.tenants");
        } else {
            console.log("⚠️ Could not find tenant with code GMCA in core.tenants");
        }

        // 2. Update Public Tenants
        const publicRes = await client.query(`
            UPDATE public.tenants 
            SET tenant_name = $1, tenant_code = $2 
            WHERE tenant_code = $3
            RETURNING *
        `, [NEW_NAME, NEW_CODE, OLD_CODE]);

        if (publicRes.rows.length > 0) {
            console.log("✅ Updated public.tenants");
        } else {
            console.log("⚠️ Could not find tenant with code GMCA in public.tenants");
        }

        console.log("\n✅ Rename Complete.");
        console.log(`New Login URL: https://gmca-ui.vercel.app/login?tenant=${NEW_CODE}`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
