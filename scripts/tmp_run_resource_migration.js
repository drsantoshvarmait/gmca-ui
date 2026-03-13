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

const migrationSql = fs.readFileSync('c:/Users/91932/gmca-ui/supabase/migrations/20260312052000_resource_blueprints.sql', 'utf8');

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        
        console.log('1. Applying Resource Blueprint Migration...');
        await client.query(migrationSql);

        console.log('2. Seeding Office Blueprint (Area & Resources)...');
        // Find Office ID
        const officeRes = await client.query("SELECT id FROM master_organisation_sub_units WHERE sub_unit_name = 'Office' LIMIT 1");
        if (officeRes.rows.length > 0) {
            const officeId = officeRes.rows[0].id;

            // Updated Area Requirement
            await client.query("UPDATE master_organisation_sub_units SET required_area = 20 WHERE id = $1", [officeId]);

            // Add Resources
            const resources = [
                { type: 'Inventory', name: 'Executive Table', qty: 1, mandatory: true },
                { type: 'Inventory', name: 'Chair', qty: 3, mandatory: true },
                { type: 'Inventory', name: 'Computer System', qty: 1, mandatory: true },
                { type: 'Human', name: 'Clerk', qty: 1, mandatory: true },
                { type: 'Workflow', name: 'Daily Attendance Reporting', qty: 1, mandatory: true }
            ];

            for (const r of resources) {
                await client.query(`
                    INSERT INTO master_sub_unit_resource_blueprints (master_sub_unit_id, resource_type, resource_name, quantity, is_mandatory)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT DO NOTHING
                `, [officeId, r.type, r.name, r.qty, r.mandatory]);
            }
        }

        console.log('3. Seeding Dissection Hall Blueprint...');
        const dhRes = await client.query("SELECT id FROM master_organisation_sub_units WHERE sub_unit_name = 'Dissection Hall' LIMIT 1");
        if (dhRes.rows.length > 0) {
            const dhId = dhRes.rows[0].id;
            await client.query("UPDATE master_organisation_sub_units SET required_area = 150 WHERE id = $1", [dhId]);

            const dhResources = [
                { type: 'Inventory', name: 'Dissection Table', qty: 10, mandatory: true },
                { type: 'Human', name: 'Attendant', qty: 2, mandatory: true },
                { type: 'Human', name: 'Technician', qty: 1, mandatory: true }
            ];

            for (const r of dhResources) {
                await client.query(`
                    INSERT INTO master_sub_unit_resource_blueprints (master_sub_unit_id, resource_type, resource_name, quantity, is_mandatory)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT DO NOTHING
                `, [dhId, r.type, r.name, r.qty, r.mandatory]);
            }
        }

        console.log('Resource Blueprints Seeded Successfully.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
