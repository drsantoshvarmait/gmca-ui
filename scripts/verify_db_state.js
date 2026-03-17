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
        console.log("--- VERIFYING DATABASE STATE ---");

        // 1. Check Tenants
        console.log("\n[CORE TENANTS]");
        const tenants = await client.query("SELECT tenant_id, tenant_name, tenant_code, status FROM core.tenants");
        console.table(tenants.rows);

        // 2. Check Organisations
        console.log("\n[CORE ORGANISATIONS]");
        const orgs = await client.query("SELECT * FROM core.organisations");
        console.table(orgs.rows);

        // 3. Check Users & Roles
        console.log("\n[CORE PROFILES]");
        const profiles = await client.query("SELECT id, email, role, tenant_id FROM core.profiles");
        console.table(profiles.rows);

        console.log("\n[CORE APP USERS]");
        const appUsers = await client.query("SELECT * FROM core.app_users");
        console.table(appUsers.rows);

        // Check if public.organisations exists (maybe it's a view?)
        // The previous error said relation "public.organisations" does not exist.
        // But apply_compatibility.js was supposed to create it.
        
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
