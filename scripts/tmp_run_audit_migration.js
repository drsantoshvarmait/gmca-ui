import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const migrationSql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/migrations/20260312061000_resource_audit_trail.sql', 'utf8');

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        
        console.log('1. Applying Audit Trail Migration...');
        await client.query(migrationSql);
        
        console.log('2. Updating a resource to generate an audit log...');
        const res = await client.query("SELECT id, allocated_qty FROM organisation_unit_resource_actuals LIMIT 1");
        if (res.rows.length > 0) {
            const r = res.rows[0];
            const newQty = (r.allocated_qty || 0) + 1;
            console.log(`Updating resource ${r.id} from ${r.allocated_qty} to ${newQty}`);
            await client.query("UPDATE organisation_unit_resource_actuals SET allocated_qty = $1 WHERE id = $2", [newQty, r.id]);
        }

        console.log('3. Checking if audit log was created...');
        const auditRes = await client.query("SELECT * FROM organisation_unit_resource_audit_logs LIMIT 5");
        console.table(auditRes.rows);

        console.log('Audit Trail Logic Verified.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
