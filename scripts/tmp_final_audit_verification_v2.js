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
        
        console.log('--- Database Audit Verification (V2) ---');
        
        // 1. Get a valid sub-unit and its organization
        const unitRes = await client.query(`
            SELECT s.id as sub_unit_id, o.organisation_id 
            FROM organisation_unit_sub_units s
            JOIN organisation_type_units u ON s.parent_unit_id = u.id
            CROSS JOIN (SELECT organisation_id FROM organisations LIMIT 1) o
            LIMIT 1
        `);
        
        if (unitRes.rows.length === 0) {
            console.log('No sub-units found to test.');
            return;
        }
        const subUnitId = unitRes.rows[0].sub_unit_id;
        const orgId = unitRes.rows[0].organisation_id;

        // 2. Clear old test logs
        await client.query("DELETE FROM organisation_unit_resource_audit_logs WHERE org_sub_unit_id = $1", [subUnitId]);

        // 3. Upsert a resource
        console.log(`Working with SubUnit ${subUnitId} and Org ${orgId}`);
        console.log('Inserting initial resource allocation...');
        await client.query(`
            INSERT INTO organisation_unit_resource_actuals (organisation_id, org_sub_unit_id, resource_name, resource_type, allocated_qty)
            VALUES ($1, $2, 'Test Table V2', 'Inventory', 20)
            ON CONFLICT (org_sub_unit_id, resource_blueprint_id) DO UPDATE SET allocated_qty = 20
        `, [orgId, subUnitId]);

        // 4. Update the resource
        console.log('Updating resource allocation...');
        await client.query(`
            UPDATE organisation_unit_resource_actuals 
            SET allocated_qty = 25 
            WHERE org_sub_unit_id = $1 AND resource_name = 'Test Table V2'
        `, [subUnitId]);

        // 5. Check if logs exist
        console.log('Checking audit logs...');
        const logs = await client.query(`
            SELECT resource_name, old_qty, new_qty, change_type, created_at 
            FROM organisation_unit_resource_audit_logs 
            WHERE org_sub_unit_id = $1 
            ORDER BY created_at ASC
        `, [subUnitId]);

        if (logs.rows.length >= 1) {
            console.log('SUCCESS: Audit logs found.');
            console.table(logs.rows);
        } else {
            console.log('FAILURE: No audit logs found.');
        }

    } catch (err) {
        console.error('Error during verification:', err.message);
    } finally {
        await client.end();
    }
}
run();
