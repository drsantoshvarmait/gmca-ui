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
        
        console.log('1. Adding "Office" to Master Sub-Unit Pool...');
        await client.query("INSERT INTO master_organisation_sub_units (sub_unit_name) VALUES ('Office') ON CONFLICT DO NOTHING");
        const officeRes = await client.query("SELECT id FROM master_organisation_sub_units WHERE sub_unit_name = 'Office' LIMIT 1");
        const officeId = officeRes.rows[0].id;

        console.log('2. Identifying all departments in Medical College...');
        // First, get all units assigned to Medical College
        const medCollegeUnits = await client.query(`
            SELECT id, unit_name FROM organisation_type_units 
            WHERE organisation_type_id = (SELECT organisation_type_id FROM organisation_types WHERE organisation_type_name = 'Medical College' LIMIT 1)
        `);

        console.log(`Found ${medCollegeUnits.rows.length} units in Medical College.`);

        console.log('3. Updating Master Blueprints for these units...');
        // For each unit name found in Med College, find its Master Unit ID and add "Office" to defaults
        for (const row of medCollegeUnits.rows) {
            const masterUnit = await client.query("SELECT id FROM master_organisation_units WHERE unit_name = $1 LIMIT 1", [row.unit_name]);
            if (masterUnit.rows.length > 0) {
                const masterUnitId = masterUnit.rows[0].id;
                await client.query(`
                    INSERT INTO master_unit_sub_unit_defaults (master_unit_id, master_sub_unit_id, sequence)
                    VALUES ($1, $2, 99) 
                    ON CONFLICT DO NOTHING
                `, [masterUnitId, officeId]);
            }
        }

        console.log('4. Mass injecting "Office" into existing assigned units to ensure immediate effect...');
        for (const row of medCollegeUnits.rows) {
            await client.query(`
                INSERT INTO organisation_unit_sub_units (parent_unit_id, sub_unit_name, sequence)
                SELECT $1, 'Office', 99
                WHERE NOT EXISTS (
                    SELECT 1 FROM organisation_unit_sub_units WHERE parent_unit_id = $1 AND sub_unit_name = 'Office'
                )
            `, [row.id]);
        }

        console.log('Hierarchy Update Complete.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
