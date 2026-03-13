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

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Testing connection...');
        const res = await client.query('SELECT NOW()');
        console.log('Connected:', res.rows[0]);
        
        console.log('Step 1: Adding Columns...');
        await client.query("ALTER TABLE public.master_organisation_sub_units ADD COLUMN IF NOT EXISTS floor_plan_template_url TEXT");
        await client.query("ALTER TABLE public.master_organisation_sub_units ADD COLUMN IF NOT EXISTS nmc_norm_reference TEXT");
        
        console.log('Step 2: Creating Tracker Table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.organisation_unit_resource_actuals (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                organisation_id UUID,
                org_sub_unit_id UUID REFERENCES public.organisation_unit_sub_units(id) ON DELETE CASCADE,
                resource_type TEXT NOT NULL,
                resource_blueprint_id UUID REFERENCES public.master_sub_unit_resource_blueprints(id),
                resource_name TEXT, 
                allocated_qty INTEGER DEFAULT 0,
                is_verified BOOLEAN DEFAULT false,
                verified_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        `);

        console.log('Step 3: Creating Gap Analysis View...');
        await client.query(`
            CREATE OR REPLACE VIEW public.vw_organisation_compliance_report AS
            SELECT 
                ot.organisation_type_name,
                u.unit_name as department_name,
                s.sub_unit_name,
                s.id as org_sub_unit_id,
                rb.resource_type,
                rb.resource_name,
                rb.quantity as required_qty,
                rb.is_mandatory,
                COALESCE(a.allocated_qty, 0) as allocated_qty,
                (COALESCE(a.allocated_qty, 0) - rb.quantity) as gap,
                CASE 
                    WHEN COALESCE(a.allocated_qty, 0) >= rb.quantity THEN 'COMPLIANT'
                    WHEN rb.is_mandatory = true AND COALESCE(a.allocated_qty, 0) < rb.quantity THEN 'NON_COMPLIANT'
                    ELSE 'PARTIAL_COMPLIANCE'
                END as status
            FROM organisation_type_units u
            JOIN organisation_types ot ON u.organisation_type_id = ot.organisation_type_id
            JOIN organisation_unit_sub_units s ON s.parent_unit_id = u.id
            JOIN master_organisation_sub_units ms ON s.sub_unit_name = ms.sub_unit_name
            JOIN master_sub_unit_resource_blueprints rb ON rb.master_sub_unit_id = ms.id
            LEFT JOIN organisation_unit_resource_actuals a ON a.org_sub_unit_id = s.id AND a.resource_blueprint_id = rb.id
        `);

        console.log('Migration Successful.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
