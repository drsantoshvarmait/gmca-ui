import pkg from 'pg';
const { Client } = pkg;

const sql = `
DO $$
DECLARE
    v_med_college_type_id uuid;
    intake_levels integer[] := ARRAY[50, 100, 200, 250];
    intake integer;
BEGIN
    SELECT organisation_type_id INTO v_med_college_type_id 
    FROM public.organisation_types 
    WHERE organisation_type_code = 'MED_COLLEGE' LIMIT 1;

    -- Delete old incomplete records for these intakes
    DELETE FROM public.governance_regulations WHERE course_name = 'MBBS' AND annual_intake IN (50, 100, 200, 250);

    FOREACH intake IN ARRAY intake_levels
    LOOP
        -- Add Detailed Infrastructure
        INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
        VALUES (
            'NMC_AUG_2023', v_med_college_type_id, 'MBBS', intake, 'INFRASTRUCTURE', 
            jsonb_build_object(
                'Skills Lab (sqm)', 600,
                'Lecture Theatre', (CASE WHEN intake <= 100 THEN 2 ELSE 4 END),
                'Hospital Beds', (CASE WHEN intake = 50 THEN 220 WHEN intake = 100 THEN 300 WHEN intake = 150 THEN 450 WHEN intake = 200 THEN 600 ELSE 750 END),
                'Non-Teaching Beds', (CASE WHEN intake <= 100 THEN 100 ELSE 200 END),
                'Common Room (Boys)', 1,
                'Common Room (Girls)', 1,
                'Class Live Streaming', 1,
                'Teaching Departments', 21,
                'Library (Reading Rooms)', (CASE WHEN intake <= 150 THEN 2 ELSE 3 END),
                'Biometric Attendance (AEBAS)', 1,
                'Dissection Hall', 1
            )
        );

        -- Add Detailed Human Resource
        INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
        VALUES (
            'NMC_AUG_2023', v_med_college_type_id, 'MBBS', intake, 'HUMAN_RESOURCE', 
            jsonb_build_object(
                'Professor', (CASE WHEN intake <= 100 THEN 1 ELSE 2 END),
                'Associate Professor', (CASE WHEN intake <= 100 THEN 2 WHEN intake = 150 THEN 4 ELSE 6 END),
                'Assistant Professor', (CASE WHEN intake <= 100 THEN 3 WHEN intake = 150 THEN 6 ELSE 9 END),
                'Senior Resident', (CASE WHEN intake <= 100 THEN 4 WHEN intake = 150 THEN 8 ELSE 12 END),
                'Junior Resident', (CASE WHEN intake <= 100 THEN 5 WHEN intake = 150 THEN 10 ELSE 15 END)
            )
        );

        -- Add Equipment 
        INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
        VALUES (
            'NMC_AUG_2023', v_med_college_type_id, 'MBBS', intake, 'EQUIPMENT', 
            jsonb_build_object(
                'MRI Machine', 1,
                'CT Scan Machine', 1,
                'Ultrasound Machine', (CASE WHEN intake <= 100 THEN 2 ELSE 4 END),
                'X-Ray Machine', (CASE WHEN intake <= 100 THEN 3 ELSE 6 END)
            )
        );

        -- Add Clinical Load 
        INSERT INTO public.governance_regulations (authority, org_type_id, course_name, annual_intake, category, requirement_logic)
        VALUES (
            'NMC_AUG_2023', v_med_college_type_id, 'MBBS', intake, 'CLINICAL_LOAD', 
            jsonb_build_object(
                'Bed Occupancy (%)', 75,
                'OPD Daily Average', (CASE WHEN intake = 50 THEN 600 WHEN intake = 100 THEN 1200 WHEN intake = 150 THEN 1800 WHEN intake = 200 THEN 2400 ELSE 3000 END),
                'Staff Attendance Min (%)', 75
            )
        );
    END LOOP;
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
        console.log("Migration: Superceded and fully populated Missing Regulations for 50/100/200/250 seats.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
