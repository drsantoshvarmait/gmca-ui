import pkg from 'pg';
const { Client } = pkg;

const sql = `
-- 1. Create a Master Table for Academic Courses if it doesn't exist
CREATE TABLE IF NOT EXISTS public.academic_courses (
    course_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    course_type text NOT NULL, -- UG, PG, SS (Super Specialty)
    course_name text NOT NULL UNIQUE, -- MBBS, MD General Medicine, MS Surgery, etc.
    created_at timestamptz DEFAULT now()
);

-- 2. Populate Common Courses
INSERT INTO public.academic_courses (course_type, course_name)
VALUES 
    ('UG', 'MBBS'),
    ('PG', 'MD General Medicine'),
    ('PG', 'MS General Surgery'),
    ('PG', 'MD Pediatrics'),
    ('PG', 'MS Obstetrics & Gynaecology'),
    ('PG', 'MD Anesthesiology'),
    ('SS', 'MCh Neurosurgery'),
    ('SS', 'DM Cardiology')
ON CONFLICT (course_name) DO NOTHING;

-- 3. Bulk Seed Regulations for different MBBS Intake Levels (50, 100, 150, 200, 250)
DO $$
DECLARE
    v_med_college_type_id uuid;
    intake_levels integer[] := ARRAY[50, 100, 150, 200, 250];
    intake integer;
BEGIN
    SELECT organisation_type_id INTO v_med_college_type_id 
    FROM public.organisation_types 
    WHERE organisation_type_code = 'MED_COLLEGE' LIMIT 1;

    FOREACH intake IN ARRAY intake_levels
    LOOP
        -- Human Resource Scaling Norms (Approximated based on NMC MSR Patterns)
        INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
        VALUES (
            'NMC_AUG_2023', 
            v_med_college_type_id, 
            'MBBS', 
            intake, 
            'HUMAN_RESOURCE', 
            jsonb_build_object(
                'Professor', (CASE WHEN intake <= 100 THEN 1 ELSE 2 END),
                'Associate Professor', (CASE WHEN intake <= 100 THEN 2 ELSE 4 END),
                'Assistant Professor', (CASE WHEN intake <= 100 THEN 3 ELSE 6 END),
                'Senior Resident', (CASE WHEN intake <= 100 THEN 4 ELSE 8 END)
            )
        ) ON CONFLICT DO NOTHING;

        -- Infrastructure Scaling Norms
        INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
        VALUES (
            'NMC_AUG_2023', 
            v_med_college_type_id, 
            'MBBS', 
            intake, 
            'INFRASTRUCTURE', 
            jsonb_build_object(
                'Skills Lab (sqm)', 600,
                'Lecture Theatre', (CASE WHEN intake <= 100 THEN 2 ELSE 4 END),
                'Hospital Beds', (CASE WHEN intake = 50 THEN 220 WHEN intake = 100 THEN 300 ELSE 450 END)
            )
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 4. Seed PG MSR Sample Rules (e.g., MD General Medicine)
-- PG rules often depend on Unit sizing (1 Professor + 1 AP + 1 Assistant per Unit)
DO $$
DECLARE
    v_med_college_type_id uuid;
BEGIN
    SELECT organisation_type_id INTO v_med_college_type_id 
    FROM public.organisation_types 
    WHERE organisation_type_code = 'MED_COLLEGE' LIMIT 1;

    INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
    VALUES (
        'NMC_PG_MSR', 
        v_med_college_type_id, 
        'MD General Medicine', 
        4, -- Seats per year
        'HUMAN_RESOURCE', 
        '{ 
            "PG Guide": 2, 
            "Total Faculty": 4, 
            "Beds per Seat": 30 
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
        console.log("Migration: Master Academic Tables and Multi-Intake (50-250) + PG Norms successfully seeded.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
