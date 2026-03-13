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
        
        console.log('1. Finding GMC Ambernath anatomy units...');
        const res = await client.query(`
            SELECT s.id as sub_unit_id, rb.id as blueprint_id, rb.resource_name, rb.quantity as req_qty
            FROM organisation_unit_sub_units s
            JOIN organisation_type_units u ON s.parent_unit_id = u.id
            JOIN organisations o ON u.organisation_type_id = o.organisation_type_id
            JOIN master_organisation_sub_units ms ON s.sub_unit_name = ms.sub_unit_name
            JOIN master_sub_unit_resource_blueprints rb ON rb.master_sub_unit_id = ms.id
            WHERE o.organisation_name ILIKE '%Ambernath%'
            AND u.unit_name = 'Anatomy Department'
            AND s.sub_unit_name = 'Office'
        `);

        if (res.rows.length > 0) {
            console.log(`Seeding ${res.rows.length} resources...`);
            for (const r of res.rows) {
                await client.query(`
                    INSERT INTO organisation_unit_resource_actuals (org_sub_unit_id, resource_blueprint_id, resource_name, allocated_qty)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (org_sub_unit_id, resource_blueprint_id) DO UPDATE SET allocated_qty = EXCLUDED.allocated_qty
                `, [r.sub_unit_id, r.blueprint_id, r.resource_name, r.req_qty]);
            }
            console.log('Seeding complete.');
        } else {
            console.log('No units found to seed. Check if hierarchy exists for Ambernath.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
