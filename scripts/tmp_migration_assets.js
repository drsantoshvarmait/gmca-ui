import pkg from 'pg';
const { Client } = pkg;

const sql = `
-- 1. Create Assets table for equipment tracking
CREATE TABLE IF NOT EXISTS public.org_assets (
    asset_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organisation_id uuid REFERENCES public.organisations(organisation_id),
    asset_name text NOT NULL, -- e.g. MRI Machine, CT Scan
    asset_type text, -- EQUIPMENT, VEHICLE, LAND
    model_number text,
    status text DEFAULT 'FUNCTIONAL', -- FUNCTIONAL, UNDER_MAINTENANCE, DECOMMISSIONED
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Seed NMC Infrastructure & Equipment Norms for 150 MBBS Seats
DO $$
DECLARE
    v_med_college_type_id uuid;
BEGIN
    SELECT organisation_type_id INTO v_med_college_type_id 
    FROM public.organisation_types 
    WHERE organisation_type_code = 'MED_COLLEGE' LIMIT 1;

    -- Infrastructure Norms
    INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
    VALUES (
        'NMC', 
        v_med_college_type_id, 
        'MBBS', 
        150, 
        'INFRASTRUCTURE', 
        '{ 
            "Dissection Hall": 1, 
            "Lecture Theatre": 4, 
            "Common Room (Boys)": 1,
            "Common Room (Girls)": 1
        }'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- Equipment/Instruments Norms
    INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
    VALUES (
        'NMC', 
        v_med_college_type_id, 
        'MBBS', 
        150, 
        'EQUIPMENT', 
        '{ 
            "MRI Machine": 1, 
            "CT Scan Machine": 1, 
            "Ultrasound Machine": 4
        }'::jsonb
    ) ON CONFLICT DO NOTHING;
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
        console.log("Migration: Assets table created and MSR Infrastructure/Equipment norms seeded.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
