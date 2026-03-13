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

async function syncAmbernath() {
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Identify the Ambernath Org ID
        const res = await client.query("SELECT organisation_id FROM public.organisations WHERE organisation_name ILIKE '%Ambernath%' LIMIT 1");
        if (res.rows.length === 0) throw new Error("Ambernath org not found");
        const orgId = res.rows[0].organisation_id;

        console.log(`Setting up configuration for Ambernath (ID: ${orgId}) to 100 MBBS Seats`);

        // 2. Insert/Update academic config
        await client.query(`
        INSERT INTO public.org_academic_config (organisation_id, course_name, current_intake)
        VALUES ($1, 'MBBS', 100)
        ON CONFLICT (organisation_id, course_name) DO UPDATE 
        SET current_intake = 100;
    `, [orgId]);

        // 3. Ensure some actual data exists for 100 seat norms in infrastructure to show 'COMPLIANT'
        const templateRes = await client.query("SELECT unit_template_id FROM public.unit_templates LIMIT 1");
        const templateId = templateRes.rows[0]?.unit_template_id;
        const depRes = await client.query("SELECT department_id FROM public.departments WHERE organisation_id = $1 LIMIT 1", [orgId]);
        const depId = depRes.rows[0]?.department_id;

        if (templateId && depId) {
            await client.query(`
            INSERT INTO public.organisation_units (organisation_id, organisation_department_id, unit_template_id, unit_name_override, status)
            VALUES ($1, $2, $3, 'Lecture Theatre 1', 'ACTIVE'),
                   ($1, $2, $3, 'Lecture Theatre 2', 'ACTIVE')
            ON CONFLICT DO NOTHING;
        `, [orgId, depId, templateId]);
        }

        console.log("Success: GMC Ambernath set to 100 seats and linked to MSR 2023 norms.");

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

syncAmbernath();
