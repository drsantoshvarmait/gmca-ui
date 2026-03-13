-- Create Tier 3 Sub-Units Table
CREATE TABLE IF NOT EXISTS public.organisation_unit_sub_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_unit_id UUID REFERENCES public.organisation_type_units(id) ON DELETE CASCADE,
    sub_unit_name TEXT NOT NULL,
    is_shared BOOLEAN DEFAULT false,
    sequence INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organisation_unit_sub_units ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view sub-units" 
ON public.organisation_unit_sub_units FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage sub-units" 
ON public.organisation_unit_sub_units FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Seed some Sub-Units for Anatomy Department (Assuming we can find the ID or just create the structure)
-- Note: Seeding by name/type matching is safer in a script than hardcoded IDs in SQL for existing data.
