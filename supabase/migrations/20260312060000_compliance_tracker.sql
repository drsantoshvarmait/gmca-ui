-- Advanced Compliance & Allocation Schema
-- 1. Extend Master Sub-Units for Floor Plan Templates & Norms
ALTER TABLE public.master_organisation_sub_units 
ADD COLUMN IF NOT EXISTS floor_plan_template_url TEXT,
ADD COLUMN IF NOT EXISTS nmc_norm_reference TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Extend Org Unit Instances for Actual Tracking
ALTER TABLE public.organisation_unit_sub_units
ADD COLUMN IF NOT EXISTS actual_area NUMERIC,
ADD COLUMN IF NOT EXISTS actual_floor_plan_url TEXT,
ADD COLUMN IF NOT EXISTS allocation_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Allocation Tracking Table (Real-world resources in a sub-unit)
CREATE TABLE IF NOT EXISTS public.organisation_unit_resource_actuals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID, -- Tenant ID
    org_sub_unit_id UUID REFERENCES public.organisation_unit_sub_units(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL, -- 'Inventory', 'Human', 'Workflow'
    resource_blueprint_id UUID REFERENCES public.master_sub_unit_resource_blueprints(id),
    resource_name TEXT, 
    allocated_qty INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Status Report View (Calculates Gap between Blueprint and Actual)
CREATE OR REPLACE VIEW public.vw_organisation_compliance_report AS
SELECT 
    ot.organisation_type,
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
LEFT JOIN organisation_unit_resource_actuals a ON a.org_sub_unit_id = s.id AND a.resource_blueprint_id = rb.id;

-- Enable RLS
ALTER TABLE public.organisation_unit_resource_actuals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their org actuals" ON public.organisation_unit_resource_actuals;
CREATE POLICY "Users can manage their org actuals" ON public.organisation_unit_resource_actuals FOR ALL TO authenticated USING (true) WITH CHECK (true);
