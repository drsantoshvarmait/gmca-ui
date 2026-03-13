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

async function fixSeed() {
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Get GMCA Org ID and a sample Department ID
        const orgRes = await client.query("SELECT organisation_id FROM public.organisations WHERE organisation_code = 'GMCA' LIMIT 1");
        const orgId = orgRes.rows[0].organisation_id;

        // Ensure at least one department exists for GMCA
        const depRes = await client.query("SELECT department_id FROM public.departments WHERE organisation_id = $1 LIMIT 1", [orgId]);
        let depId;
        if (depRes.rows.length === 0) {
            // Create a default 'Admin' department if none exists
            const newDep = await client.query("INSERT INTO public.departments (organisation_id, department_code, department_name) VALUES ($1, 'ADMIN', 'Administrative Department') RETURNING department_id", [orgId]);
            depId = newDep.rows[0].department_id;
        } else {
            depId = depRes.rows[0].department_id;
        }

        // 2. Setup Academic Config
        await client.query(`
        INSERT INTO public.org_academic_config (organisation_id, course_name, current_intake)
        VALUES ($1, 'MBBS', 150)
        ON CONFLICT (organisation_id, course_name) DO UPDATE SET current_intake = 150
    `, [orgId]);

        // 3. Seed Actual Resources with the Mandatory Dept ID
        await client.query(`
        INSERT INTO public.organisation_units (organisation_id, organisation_department_id, unit_name_override, status)
        VALUES 
            ($1, $2, 'Main Lecture Theatre (LT-1)', 'ACTIVE'),
            ($1, $2, 'Lecture Theatre (LT-2)', 'ACTIVE'),
            ($1, $2, 'Anatomy Dissection Hall', 'ACTIVE')
    `, [orgId, depId]);

        // 4. Assets don't have this constraint
        await client.query(`
        INSERT INTO public.org_assets (organisation_id, asset_name, asset_type, status)
        VALUES 
            ($1, 'GE Signa 1.5T MRI Machine', 'EQUIPMENT', 'FUNCTIONAL'),
            ($1, 'Philips Computed Tomography (CT)', 'EQUIPMENT', 'FUNCTIONAL')
    `, [orgId]);

        console.log("Success: GMCA compliance data seeded successfully with department links.");

    } catch (err) {
        console.error("Seed failed:", err.message);
    } finally {
        await client.end();
    }
}

fixSeed();
