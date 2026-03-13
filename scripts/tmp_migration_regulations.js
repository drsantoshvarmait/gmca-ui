import pkg from 'pg';
const { Client } = pkg;

const sql = `
-- 1. Regulation Registry: Stores NMC, MCSR, and State rules
CREATE TABLE IF NOT EXISTS public.governance_regulations (
    regulation_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    authority text NOT NULL, -- NMC, MCSR, Pollution Control
    org_type_id uuid REFERENCES public.organisation_types(organisation_type_id),
    course_name text, -- MBBS, MS, MD, MCh
    annual_intake integer, -- e.g. 100, 150, 250
    category text NOT NULL, -- HUMAN_RESOURCE, INFRASTRUCTURE, EQUIPMENT
    requirement_logic jsonb NOT NULL, -- The actual norm: { "Professor": 1, "Beds": 500 }
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 2. Organization Configuration (Context)
-- Tracks what courses/intake the specific college is running
CREATE TABLE IF NOT EXISTS public.org_academic_config (
    config_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organisation_id uuid REFERENCES public.organisations(organisation_id),
    course_name text NOT NULL,
    current_intake integer NOT NULL,
    effective_date date DEFAULT current_date,
    UNIQUE(organisation_id, course_name)
);

-- 3. Seed: Sample NMC Norm for GMC Akola (MBBS 150 Seats)
DO $$
DECLARE
    v_med_college_type_id uuid;
BEGIN
    SELECT organisation_type_id INTO v_med_college_type_id 
    FROM public.organisation_types 
    WHERE organisation_type_code = 'MED_COLLEGE' LIMIT 1;

    INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
    VALUES (
        'NMC', 
        v_med_college_type_id, 
        'MBBS', 
        150, 
        'HUMAN_RESOURCE', 
        '{ 
            "Professor": 1, 
            "Associate Professor": 2, 
            "Assistant Professor": 3, 
            "Senior Resident": 4, 
            "Junior Resident": 10 
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
        console.log("Governance: Regulation Registry and Academic Config tables created.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
