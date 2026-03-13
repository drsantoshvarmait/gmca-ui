import pkg from 'pg';
const { Client } = pkg;

const sql = `
-- Update GMC Ambernath (GMCA) to its official intake of 100 MBBS seats
DO $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT organisation_id INTO v_org_id 
    FROM public.organisations 
    WHERE organisation_code = 'GMCA' LIMIT 1;

    UPDATE public.org_academic_config 
    SET current_intake = 100, course_name = 'MBBS'
    WHERE organisation_id = v_org_id;

    -- If the config doesn't exist for some reason, insert it
    INSERT INTO public.org_academic_config (organisation_id, course_name, current_intake)
    SELECT v_org_id, 'MBBS', 100
    WHERE NOT EXISTS (SELECT 1 FROM public.org_academic_config WHERE organisation_id = v_org_id);

    RAISE NOTICE 'GMC Ambernath intake updated to 100 MBBS seats.';
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
        console.log("Success: GMC Ambernath official config updated to 100 MBBS seats.");
    } catch (err) {
        console.error("Update failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
