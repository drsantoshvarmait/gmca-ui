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
        
        console.log('Updating vw_organisation_compliance_report to be organisation-specific...');
        
        const sql = `
        CREATE OR REPLACE VIEW public.vw_organisation_compliance_report AS
        SELECT 
            o.organisation_id,
            o.organisation_name,
            ot.organisation_type_name,
            u_type.unit_name as department_name,
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
        FROM public.organisation_units o_inst
        JOIN public.organisations o ON o_inst.organisation_id = o.organisation_id
        JOIN public.organisation_type_units u_type ON o_inst.unit_template_id = u_type.id
        JOIN public.organisation_types ot ON u_type.organisation_type_id = ot.organisation_type_id
        JOIN public.organisation_unit_sub_units s ON s.parent_unit_id = u_type.id
        JOIN public.master_organisation_sub_units ms ON s.sub_unit_name = ms.sub_unit_name
        JOIN public.master_sub_unit_resource_blueprints rb ON rb.master_sub_unit_id = ms.id
        LEFT JOIN public.organisation_unit_resource_actuals a ON 
            a.org_sub_unit_id = s.id AND 
            a.resource_blueprint_id = rb.id AND 
            a.organisation_id = o.organisation_id;
        `;

        await client.query(sql);
        console.log('View updated successfully.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
