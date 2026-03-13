-- Resource Blueprint System (Assest, Manpower, Space)
ALTER TABLE public.master_organisation_sub_units 
ADD COLUMN IF NOT EXISTS required_area NUMERIC,
ADD COLUMN IF NOT EXISTS area_uom TEXT DEFAULT 'sq.mt.';

CREATE TABLE IF NOT EXISTS public.master_sub_unit_resource_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_sub_unit_id UUID REFERENCES public.master_organisation_sub_units(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL, -- 'Inventory', 'Human', 'Workflow'
    resource_name TEXT NOT NULL, -- e.g. 'Table', 'Clerk', 'Daily Attendance'
    quantity INTEGER DEFAULT 1,
    is_mandatory BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_sub_unit_resource_blueprints ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view resource blueprints" 
ON public.master_sub_unit_resource_blueprints FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Superadmins can manage resource blueprints" 
ON public.master_sub_unit_resource_blueprints FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
