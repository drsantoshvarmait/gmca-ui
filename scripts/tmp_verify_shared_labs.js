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

        // 1. Update masters to be shared by default
        console.log('\n--- Marking Labs as Shared Masters ---');
        const updateRes = await client.query(`
            UPDATE master_organisation_sub_units 
            SET is_shared_by_default = true 
            WHERE sub_unit_name IN ('Histology Lab', 'Histopathology Lab')
            RETURNING sub_unit_name, required_area, is_shared_by_default
        `);
        console.table(updateRes.rows);

        // 2. Get current masters list
        console.log('\n--- All Sub-Unit Masters ---');
        const mastersRes = await client.query(`
            SELECT sub_unit_name, required_area, is_shared_by_default 
            FROM master_organisation_sub_units 
            ORDER BY sub_unit_name
        `);
        console.table(mastersRes.rows);

        // 3. Get Anatomy Department ID (Medical College)
        const anatomyRes = await client.query(`
            SELECT u.id, u.unit_name, t.organisation_type_name
            FROM organisation_type_units u
            JOIN organisation_types t ON t.organisation_type_id = u.organisation_type_id
            WHERE u.unit_name = 'Anatomy Department'
            AND t.organisation_type_name = 'Medical College'
            LIMIT 1
        `);
        const anatomy = anatomyRes.rows[0];
        console.log(`\n[Anatomy Department] ID: ${anatomy?.id}`);

        // 4. Get or create Pathology Department
        let pathRes = await client.query(`
            SELECT u.id, u.unit_name
            FROM organisation_type_units u
            JOIN organisation_types t ON t.organisation_type_id = u.organisation_type_id
            WHERE u.unit_name = 'Pathology Department'
            AND t.organisation_type_name = 'Medical College'
            LIMIT 1
        `);
        if (pathRes.rows.length === 0) {
            const typeRes = await client.query(`SELECT organisation_type_id FROM organisation_types WHERE organisation_type_name = 'Medical College' LIMIT 1`);
            const typeId = typeRes.rows[0].organisation_type_id;
            pathRes = await client.query(`
                INSERT INTO organisation_type_units (organisation_type_id, unit_name)
                VALUES ($1, 'Pathology Department')
                RETURNING id, unit_name
            `, [typeId]);
            console.log('[Created] Pathology Department');
        }
        const pathology = pathRes.rows[0];
        console.log(`[Pathology Department] ID: ${pathology?.id}`);

        // 5. Add Histology Lab (Shared) to Anatomy Department if not exists
        const histoExistRes = await client.query(`
            SELECT id FROM organisation_unit_sub_units 
            WHERE parent_unit_id = $1 AND sub_unit_name = 'Histology Lab (Shared)'
        `, [anatomy?.id]);

        if (histoExistRes.rows.length === 0) {
            await client.query(`
                INSERT INTO organisation_unit_sub_units (parent_unit_id, sub_unit_name, actual_area, is_shared)
                VALUES ($1, 'Histology Lab (Shared)', 150, true)
            `, [anatomy?.id]);
            console.log('\n[Added] Histology Lab (Shared) to Anatomy Department');
        } else {
            console.log('\n[Already Exists] Histology Lab (Shared) in Anatomy Department');
        }

        // 6. Add Histology Lab (Shared) to Pathology Department if not exists
        const histoPathExistRes = await client.query(`
            SELECT id FROM organisation_unit_sub_units 
            WHERE parent_unit_id = $1 AND sub_unit_name = 'Histology Lab (Shared)'
        `, [pathology?.id]);

        if (histoPathExistRes.rows.length === 0) {
            await client.query(`
                INSERT INTO organisation_unit_sub_units (parent_unit_id, sub_unit_name, actual_area, is_shared)
                VALUES ($1, 'Histology Lab (Shared)', 150, true)
            `, [pathology?.id]);
            console.log('[Added] Histology Lab (Shared) to Pathology Department');
        } else {
            console.log('[Already Exists] Histology Lab (Shared) in Pathology Department');
        }

        // 7. Verify final state
        console.log('\n--- Sub-Units under Anatomy Department ---');
        const anatomySubsRes = await client.query(`
            SELECT sub_unit_name, actual_area, is_shared 
            FROM organisation_unit_sub_units 
            WHERE parent_unit_id = $1 
            ORDER BY sub_unit_name
        `, [anatomy?.id]);
        console.table(anatomySubsRes.rows);

        console.log('\n--- Sub-Units under Pathology Department ---');
        const pathSubsRes = await client.query(`
            SELECT sub_unit_name, actual_area, is_shared 
            FROM organisation_unit_sub_units 
            WHERE parent_unit_id = $1 
            ORDER BY sub_unit_name
        `, [pathology?.id]);
        console.table(pathSubsRes.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
