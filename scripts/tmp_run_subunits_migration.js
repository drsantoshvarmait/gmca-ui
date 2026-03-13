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

const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/migrations/20260312050000_org_sub_units.sql', 'utf8');

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Applying Sub-Units Migration...');
        await client.query(sql);
        console.log('Migration Successful.');

        // Seed some data for Medical College if it exists
        const res = await client.query(`
            SELECT id FROM organisation_type_units 
            WHERE unit_name = 'Anatomy Department' 
            AND organisation_type_id = (SELECT organisation_type_id FROM organisation_types WHERE organisation_type_name = 'Medical College' LIMIT 1)
            LIMIT 1
        `);

        if (res.rows.length > 0) {
            const parentId = res.rows[0].id;
            console.log('Seeding sub-units for Anatomy Dept...');
            await client.query(`
                INSERT INTO organisation_unit_sub_units (parent_unit_id, sub_unit_name, sequence)
                VALUES 
                ('${parentId}', 'Dissection Hall', 0),
                ('${parentId}', 'Histology Lab', 1)
                ON CONFLICT DO NOTHING
            `);
        }
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
