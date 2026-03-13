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

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        const logs = await client.query("SELECT resource_name, old_qty, new_qty, change_type FROM organisation_unit_resource_audit_logs ORDER BY created_at DESC LIMIT 5");
        console.log('AUDIT_LOG_JSON_START');
        console.log(JSON.stringify(logs.rows, null, 2));
        console.log('AUDIT_LOG_JSON_END');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
