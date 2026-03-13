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

async function r() {
    const c = new Client(config);
    await c.connect();
    const res = await c.query(`
    CREATE TABLE IF NOT EXISTS public.org_type_designations (
        org_type_designation_id SERIAL PRIMARY KEY,
        organisation_type_id uuid REFERENCES public.organisation_types(organisation_type_id) ON DELETE CASCADE,
        designation_id uuid REFERENCES public.designations(designation_id) ON DELETE CASCADE,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        UNIQUE(organisation_type_id, designation_id)
    );
  `);
    console.log("Created table org_type_designations");

    // Also, link all current NMC designations to MED_COLLEGE type
    const linkRes = await c.query(`
    INSERT INTO public.org_type_designations (organisation_type_id, designation_id)
    SELECT ot.organisation_type_id, d.designation_id
    FROM public.organisation_types ot
    CROSS JOIN public.designations d
    WHERE ot.organisation_type_code = 'MED_COLLEGE'
      AND d.designation_code LIKE 'NMC_%'
    ON CONFLICT DO NOTHING;
  `);
    console.log("Linked NMC designations to MED_COLLEGE:", linkRes.rowCount);

    await c.end();
}
r();
