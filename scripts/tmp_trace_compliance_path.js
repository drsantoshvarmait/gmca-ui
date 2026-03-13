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
        console.log(`Tracing relationships for Org: ${ambernathId}`);

        // 1. Get Units for this Org
        const units = await client.query("SELECT * FROM organisation_units WHERE organisation_id = $1", [ambernathId]);
        console.log("\n--- Organisation Units ---");
        console.table(units.rows);

        if (units.rows.length > 0) {
            const firstUnit = units.rows[0];
            
            // 2. Check organisation_departments
            const dept = await client.query("SELECT * FROM organisation_departments WHERE organisation_department_id = $1", [firstUnit.organisation_department_id]);
            console.log("\n--- Organisation Department ---");
            console.table(dept.rows);

            // 3. Check organisation_type_units (Checking if this is what sub_units link to)
            // Note: We saw earlier that sub_units link to parent_unit_id
            const typeUnits = await client.query("SELECT * FROM organisation_type_units LIMIT 5");
            console.log("\n--- Organisation Type Units (Sample) ---");
            console.table(typeUnits.rows);

            // 4. Try to find any sub_units linked to our units/depts/templates
            const subUnitsViaDept = await client.query("SELECT * FROM organisation_unit_sub_units WHERE parent_unit_id = $1", [firstUnit.organisation_department_id]);
            console.log("\n--- Sub Units via Dept ID ---");
            console.log(`Count: ${subUnitsViaDept.rows.length}`);

            const subUnitsViaTemplate = await client.query("SELECT * FROM organisation_unit_sub_units WHERE parent_unit_id = $1", [firstUnit.unit_template_id]);
            console.log("\n--- Sub Units via Template ID ---");
            console.log(`Count: ${subUnitsViaTemplate.rows.length}`);
            
            // Search globally for sub_units to see what IDs they typically use as parent_unit_id
            const sampleSubUnits = await client.query("SELECT parent_unit_id, COUNT(*) FROM organisation_unit_sub_units GROUP BY parent_unit_id LIMIT 5");
            console.log("\n--- Global Sub Units Parent IDs ---");
            console.table(sampleSubUnits.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
