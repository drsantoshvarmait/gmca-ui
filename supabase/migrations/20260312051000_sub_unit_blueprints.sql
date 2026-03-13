-- Tier 3 Master Pool & Blueprint System
CREATE TABLE IF NOT EXISTS public.master_organisation_sub_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_unit_name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Blueprint Mapping (Default composition of a Unit)
CREATE TABLE IF NOT EXISTS public.master_unit_sub_unit_defaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_unit_id UUID REFERENCES public.master_organisation_units(id) ON DELETE CASCADE,
    master_sub_unit_id UUID REFERENCES public.master_organisation_sub_units(id) ON DELETE CASCADE,
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(master_unit_id, master_sub_unit_id)
);

-- Enable RLS
ALTER TABLE public.master_organisation_sub_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_unit_sub_unit_defaults ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view master sub-units" ON public.master_organisation_sub_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmins can manage master sub-units" ON public.master_organisation_sub_units FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view unit defaults" ON public.master_unit_sub_unit_defaults FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmins can manage unit defaults" ON public.master_unit_sub_unit_defaults FOR ALL TO authenticated USING (true) WITH CHECK (true);
