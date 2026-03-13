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
        const ambernathId = '51b52722-065d-4d41-8c9e-531bcf66e93f';
        const typeId = 'f6404a0e-6972-499b-940e-75d3424a653d'; // GMC type

        console.log(`Testing Blueprint Join Path for Ambernath...`);
        
        const sql = `
        SELECT 
            o.organisation_name,
            u.unit_name as blueprint_dept,
            s.sub_unit_name,
            rb.resource_name,
            rb.quantity as required
        FROM organisations o
        JOIN organisation_type_units u ON o.organisation_type_id = u.organisation_type_id
        JOIN organisation_unit_sub_units s ON s.parent_unit_id = u.id
        JOIN master_organisation_sub_units ms ON s.sub_unit_name = ms.sub_unit_name
        JOIN master_sub_unit_resource_blueprints rb ON rb.master_sub_unit_id = ms.id
        WHERE o.organisation_id = $1
        LIMIT 10;
        `;

        const res = await client.query(sql, [ambernathId]);
        console.table(res.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
