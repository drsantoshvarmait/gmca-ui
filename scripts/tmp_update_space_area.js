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
        
        console.log('Updating Dissection Hall area to 150 sq.mt...');
        const sql = `
            UPDATE organisation_unit_sub_units 
            SET actual_area = 150 
            WHERE sub_unit_name = 'Dissection Hall' 
            AND parent_unit_id IN (SELECT id FROM organisation_type_units WHERE unit_name = 'Anatomy Department')
        `;
        const res = await client.query(sql);
        console.log(`Updated ${res.rowCount} rows.`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
