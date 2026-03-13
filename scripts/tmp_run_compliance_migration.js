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

const migrationSql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/migrations/20260312060000_compliance_tracker.sql', 'utf8');

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        
        console.log('1. Applying Compliance Tracker Migration...');
        await client.query(migrationSql);

        console.log('2. Mocking Real Allocation for Medical College (GMC Ambernath)...');
        // Find Anatomy Office for a specific organisation
        const orgSubUnits = await client.query(`
            SELECT s.id as sub_unit_id, rb.id as blueprint_id, rb.resource_name, rb.quantity as req_qty
            FROM organisation_unit_sub_units s
            JOIN organisation_type_units u ON s.parent_unit_id = u.id
            JOIN organisation_types ot ON u.organisation_type_id = ot.organisation_type_id
            JOIN master_organisation_sub_units ms ON s.sub_unit_name = ms.sub_unit_name
            JOIN master_sub_unit_resource_blueprints rb ON rb.master_sub_unit_id = ms.id
            WHERE ot.organisation_type_name = 'Medical College' 
            AND u.unit_name = 'Anatomy Department'
            AND s.sub_unit_name = 'Office'
        `);

        if (orgSubUnits.rows.length > 0) {
            console.log(`Found ${orgSubUnits.rows.length} resources to allocate.`);
            for (const r of orgSubUnits.rows) {
                // Mocking: Allocate only partial quantity for "Chair" as a test
                let allocQty = r.req_qty;
                if (r.resource_name === 'Chair') {
                    allocQty = 1; // Requirement is 3, actual is 1 => NON_COMPLIANT
                    console.log(`Intentionally under-allocating ${r.resource_name} (Alloc: 1, Req: 3)`);
                }

                await client.query(`
                    INSERT INTO organisation_unit_resource_actuals (org_sub_unit_id, resource_blueprint_id, resource_name, allocated_qty)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                `, [r.sub_unit_id, r.blueprint_id, r.resource_name, allocQty]);
            }
        }

        console.log('Compliance Tracking Seeds Complete.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
