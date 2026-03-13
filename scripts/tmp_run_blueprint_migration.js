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

const sql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/migrations/20260312051000_sub_unit_blueprints.sql', 'utf8');

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Applying Blueprint Migration...');
        await client.query(sql);
        console.log('Migration Successful.');

        console.log('Seeding Master Sub-Units...');
        const subUnits = ['Dissection Hall', 'Histology Lab', 'Pathology Museum', 'Histopathology Lab', 'Biochemistry Lab', 'Microbiology Lab'];
        for (const name of subUnits) {
            await client.query(`INSERT INTO master_organisation_sub_units (sub_unit_name) VALUES ('${name}') ON CONFLICT (sub_unit_name) DO NOTHING`);
        }

        console.log('Establishing Anatomy Blueprint...');
        const anatomyRes = await client.query("SELECT id FROM master_organisation_units WHERE unit_name = 'Anatomy Department' LIMIT 1");
        if (anatomyRes.rows.length > 0) {
            const anatomyId = anatomyRes.rows[0].id;
            const subsRes = await client.query("SELECT id, sub_unit_name FROM master_organisation_sub_units WHERE sub_unit_name IN ('Dissection Hall', 'Histology Lab')");
            
            for (let i = 0; i < subsRes.rows.length; i++) {
                await client.query(`
                    INSERT INTO master_unit_sub_unit_defaults (master_unit_id, master_sub_unit_id, sequence)
                    VALUES ('${anatomyId}', '${subsRes.rows[i].id}', ${i})
                    ON CONFLICT DO NOTHING
                `);
            }
        }
        
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
