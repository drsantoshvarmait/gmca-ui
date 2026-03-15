-- =========================================
-- CORE RECONSTRUCTION MIGRATION
-- Restores tables that were manually created in Supabase Dashboard
-- =========================================

-- 1. Organisation Types (Required for hierarchy)
CREATE TABLE IF NOT EXISTS public.organisation_types (
    organisation_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_type TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organisations (The main entity)
CREATE TABLE IF NOT EXISTS public.organisations (
    organisation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_name TEXT NOT NULL,
    organisation_type_id UUID REFERENCES public.organisation_types(organisation_type_id),
    tenant_id UUID REFERENCES core.tenants(tenant_id),
    parent_organisation_id UUID REFERENCES public.organisations(organisation_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Units Master (Standalone lookup)
CREATE TABLE IF NOT EXISTS public.units_master (
    unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Seed basic types for UI to function
INSERT INTO public.organisation_types (organisation_type) 
VALUES ('Medical College'), ('Hospital'), ('Administrative Unit')
ON CONFLICT DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.organisation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read types" ON public.organisation_types FOR SELECT USING (true);
CREATE POLICY "Allow public read units" ON public.units_master FOR SELECT USING (true);
CREATE POLICY "Tenant isolation orgs" ON public.organisations FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
