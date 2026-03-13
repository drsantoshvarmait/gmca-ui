import pkg from 'pg';
const { Client } = pkg;

const sql = `
DO $$
DECLARE
    intake integer;
    intake_levels integer[] := ARRAY[50, 100, 150, 200, 250];
BEGIN
    FOREACH intake IN ARRAY intake_levels
    LOOP
        UPDATE public.governance_regulations
        SET requirement_logic = jsonb_build_object(
            'Anatomy - Professor', 1,
            'Anatomy - Associate Professor', (CASE WHEN intake <= 100 THEN 1 ELSE 2 END),
            'Anatomy - Assistant Professor', (CASE WHEN intake <= 150 THEN 2 ELSE 3 END),
            
            'Physiology - Professor', 1,
            'Physiology - Associate Professor', (CASE WHEN intake <= 150 THEN 1 ELSE 2 END),
            'Physiology - Assistant Professor', (CASE WHEN intake <= 100 THEN 2 ELSE 3 END),
            
            'Biochemistry - Professor', 1,
            'Biochemistry - Associate Professor', (CASE WHEN intake <= 200 THEN 1 ELSE 2 END),
            
            'General Medicine - Professor', (CASE WHEN intake <= 100 THEN 1 ELSE 2 END),
            'General Medicine - Associate Professor', (CASE WHEN intake <= 100 THEN 2 WHEN intake = 150 THEN 4 ELSE 6 END),
            
            'Non-Teaching - Librarian', 1,
            'Non-Teaching - Documentalist', 1,
            'Non-Teaching - Store Keeper', (CASE WHEN intake <= 100 THEN 2 ELSE 4 END),
            'Non-Teaching - Steno Typist', (CASE WHEN intake <= 100 THEN 2 ELSE 4 END),
            'Non-Teaching - Computer Operator', (CASE WHEN intake <= 150 THEN 2 ELSE 5 END),
            'Non-Teaching - Lab Technician', (CASE WHEN intake <= 100 THEN 10 WHEN intake <= 150 THEN 15 ELSE 25 END)
        )
        WHERE course_name = 'MBBS' 
          AND category = 'HUMAN_RESOURCE' 
          AND annual_intake = intake;
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
        console.log("Success: HR Norms updated to include subjects and non-teaching posts.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
