import pkg from 'pg';
const { Client } = pkg;

const sql = `
-- 1. Upgrade Infrastructure Norms (150 Case)
-- Skills Lab (Min 600 sqm), 21 Depts, 100% Hostel, AEBAS implementation
DO $$
DECLARE
    v_med_college_type_id uuid;
BEGIN
    SELECT organisation_type_id INTO v_med_college_type_id 
    FROM public.organisation_types 
    WHERE organisation_type_code = 'MED_COLLEGE' LIMIT 1;

    -- Update Infrastructure with precision (based on UG-MSR Aug 2023)
    INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
    VALUES (
        'NMC_AUG_2023', 
        v_med_college_type_id, 
        'MBBS', 
        150, 
        'INFRASTRUCTURE', 
        '{ 
            "Skills Lab (sqm)": 600, 
            "Lecture Theatre": 4, 
            "Teaching Departments": 21,
            "Common Room (Boys)": 1,
            "Common Room (Girls)": 1,
            "Biometric Attendance (AEBAS)": 1,
            "Class Live Streaming": 1,
            "Library (Reading Rooms)": 2
        }'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- Faculty Attendance & Clinical Load Norms
    INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
    VALUES (
        'NMC_AUG_2023', 
        v_med_college_type_id, 
        'MBBS', 
        150, 
        'CLINICAL_LOAD', 
        '{ 
            "OPD Daily Average": 1200, 
            "Bed Occupancy (%)": 75,
            "Staff Attendance Min (%)": 75
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
        console.log("Migration: NMC UG-MSR August 2023 Norms (150 Seats) successfully integrated.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
