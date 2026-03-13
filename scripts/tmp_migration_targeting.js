import pkg from 'pg';
const { Client } = pkg;

const sql = `
-- 1. Add targeting column to workflow
ALTER TABLE public.sop_workflow 
ADD COLUMN IF NOT EXISTS target_organisation_type_id uuid REFERENCES public.organisation_types(organisation_type_id);

-- 2. Create 'Medical College' type if it doesn't exist
INSERT INTO public.organisation_types (organisation_type_code, organisation_type_name, active)
VALUES ('MED_COLLEGE', 'Medical College', true)
ON CONFLICT (organisation_type_code) DO NOTHING;

-- 3. Update our existing GMCA organizations to be Medical Colleges
UPDATE public.organisations 
SET organisation_type_id = (SELECT organisation_type_id FROM public.organisation_types WHERE organisation_type_code = 'MED_COLLEGE')
WHERE organisation_code = 'GMCA';
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
        console.log("Migration: Workflow targeting enabled and GMCA categorized as Medical College.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
