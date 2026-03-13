import pkg from 'pg';
const { Client } = pkg;

const sql = `
-- 1. Setup GMCA Academic Config: 150 MBBS Seats
DO $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT organisation_id INTO v_org_id 
    FROM public.organisations 
    WHERE organisation_code = 'GMCA' LIMIT 1;

    INSERT INTO public.org_academic_config (organisation_id, course_name, current_intake)
    VALUES (v_org_id, 'MBBS', 150)
    ON CONFLICT (organisation_id, course_name) DO UPDATE 
    SET current_intake = 150;

    -- 2. Seed some "Actual" Infrastructure Org Units
    INSERT INTO public.organisation_units (organisation_id, unit_name_override, status)
    VALUES 
        (v_org_id, 'Main Lecture Theatre (LT-1)', 'ACTIVE'),
        (v_org_id, 'Lecture Theatre (LT-2)', 'ACTIVE'),
        (v_org_id, 'Anatomy Dissection Hall', 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 3. Seed some "Actual" Equipment Assets
    INSERT INTO public.org_assets (organisation_id, asset_name, asset_type, status)
    VALUES 
        (v_org_id, 'GE Signa 1.5T MRI Machine', 'EQUIPMENT', 'FUNCTIONAL'),
        (v_org_id, 'Philips Computed Tomography (CT)', 'EQUIPMENT', 'FUNCTIONAL')
    ON CONFLICT DO NOTHING;

END $$;
`;

const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        await client.query(sql);
        console.log("Migration: GMCA Academic Config and Assets seeded for testing.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
