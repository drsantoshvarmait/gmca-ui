import pkg from 'pg';
const { Client } = pkg;
const connectionString = "postgresql://postgres.ulfrylptbnrfewodzhck:Annuji1*4713@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

async function check() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        const { rows: tenants } = await client.query('SELECT tenant_id, tenant_name FROM core.tenants');
        const { rows: users } = await client.query('SELECT user_id FROM core.app_users');

        console.log("TENANTS:", tenants);
        console.log("USERS:", users.length);
    } catch (err) {
        console.error("CHECK ERROR:", err.message);
    } finally {
        await client.end();
    }
}
check();
