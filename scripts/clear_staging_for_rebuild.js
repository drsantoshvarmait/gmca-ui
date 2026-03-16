import pkg from 'pg';
const { Client } = pkg;

const STAGING = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.risrmpdbvoafowdvnonn',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const clearSql = `
BEGIN;
-- Drop views first to avoid dependency errors
DROP VIEW IF EXISTS public.vw_organisation_compliance_report CASCADE;
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP VIEW IF EXISTS public.v_notifications CASCADE;
DROP VIEW IF EXISTS public.v_workflow_health_dashboard CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.organisation_unit_resource_audit_logs CASCADE;
DROP TABLE IF EXISTS public.organisation_unit_resource_actuals CASCADE;
DROP TABLE IF EXISTS public.organisation_unit_sub_units CASCADE;
DROP TABLE IF EXISTS public.organisation_type_units CASCADE;
DROP TABLE IF EXISTS public.organisation_units CASCADE;
DROP TABLE IF EXISTS public.user_org_roles CASCADE;
DROP TABLE IF EXISTS public.organisations CASCADE;
DROP TABLE IF EXISTS public.organisation_types CASCADE;
DROP TABLE IF EXISTS public.master_sub_unit_resource_blueprints CASCADE;
DROP TABLE IF EXISTS public.master_organisation_sub_units CASCADE;
DROP TABLE IF EXISTS public.master_unit_sub_unit_defaults CASCADE;
DROP TABLE IF EXISTS public.master_organisation_units CASCADE;
DROP TABLE IF EXISTS public.sop_step CASCADE;
DROP TABLE IF EXISTS public.sop_workflow CASCADE;

-- Clear migration history so the pipeline re-runs everything
-- Note: Supabase CLI uses a table in 'supabase_migrations' schema or 'public._supabase_migrations'
-- Let's try to find it and clear it.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_supabase_migrations') THEN
        DELETE FROM public._supabase_migrations;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'supabase_migrations') THEN
        DELETE FROM supabase_migrations.schema_migrations;
    END IF;
END $$;

COMMIT;
`;

async function main() {
    const client = new Client(STAGING);
    try {
        await client.connect();
        console.log("Wiping Staging environment for a clean rebuild...");
        await client.query(clearSql);
        console.log("✅ Staging environment cleared. The next deployment pipeline run will rebuild the database from scratch.");
    } catch (err) {
        console.error("❌ Error clearing Staging:", err.message);
    } finally {
        await client.end();
    }
}

main();
