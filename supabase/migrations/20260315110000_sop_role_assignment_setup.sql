-- Total Governance: Master Designations and SOP Role Binding
BEGIN;

-- 1. Create Designations table if it truly doesn't exist
CREATE TABLE IF NOT EXISTS public.designations (
    designation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation_name TEXT NOT NULL UNIQUE,
    designation_code TEXT UNIQUE,
    designation_group TEXT, -- e.g. 'TEACHING_FACULTY', 'NON_TEACHING'
    is_teaching BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    tenant_id UUID -- Optional tenant isolation if needed
);

-- 2. Create Org Type mapping table (referenced in HRModule.jsx)
CREATE TABLE IF NOT EXISTS public.org_type_designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_type_id UUID REFERENCES public.organisation_types(organisation_type_id) ON DELETE CASCADE,
    designation_id UUID REFERENCES public.designations(designation_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organisation_type_id, designation_id)
);

-- 3. Update SOP Steps with Role and Visual Metadata
ALTER TABLE public.sop_step ADD COLUMN IF NOT EXISTS designation_id UUID REFERENCES public.designations(designation_id);
ALTER TABLE public.sop_step ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 0;
ALTER TABLE public.sop_step ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 0;

-- 4. Seed some standard designations to make the UI immediately useful
INSERT INTO public.designations (designation_name, designation_code, designation_group, is_teaching)
VALUES 
('Dean / Principal', 'DEAN', 'ADMIN', true),
('Medical Superintendent', 'MS', 'ADMIN', false),
('Professor & Head', 'HOD', 'TEACHING_FACULTY', true),
('Registrar', 'REG', 'ADMIN', false),
('Purchase Officer', 'PUR_OFF', 'PROCUREMENT', false),
('Accountant', 'ACC', 'FINANCE', false),
('Junior Resident', 'JR', 'TEACHING_FACULTY', true)
ON CONFLICT (designation_name) DO NOTHING;

COMMENT ON TABLE public.designations IS 'Master directory of all job titles/roles across the organization network.';
COMMENT ON COLUMN public.sop_step.designation_id IS 'The specific role responsible for executing this step in the SOP.';

COMMIT;
