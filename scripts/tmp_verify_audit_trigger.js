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
        
        console.log('Fetching a resource to update...');
        const res = await client.query("SELECT id, allocated_qty, resource_name FROM organisation_unit_resource_actuals LIMIT 1");
        if (res.rows.length > 0) {
            const r = res.rows[0];
            const newQty = (r.allocated_qty || 0) + 5;
            console.log(`Updating resource '${r.resource_name}' (ID: ${r.id}) from ${r.allocated_qty} to ${newQty}`);
            
            await client.query("UPDATE organisation_unit_resource_actuals SET allocated_qty = $1 WHERE id = $2", [newQty, r.id]);
            
            console.log('Fetching audit logs...');
            const auditRes = await client.query("SELECT id, old_qty, new_qty, resource_name, created_at FROM organisation_unit_resource_audit_logs ORDER BY created_at DESC LIMIT 5");
            console.table(auditRes.rows);
        } else {
            console.log('No resources found to update.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
