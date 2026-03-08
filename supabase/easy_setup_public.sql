-- =====================================================
-- EASY PRODUCTION SETUP: PUBLIC SCHEMA
-- Purpose: Initialize MEDD/GMCA in the 'public' schema
-- to avoid Supabase "Exposed Schema" configuration issues.
-- =====================================================

-- 1. Create the tenants table in PUBLIC
CREATE TABLE IF NOT EXISTS public.tenants (
    tenant_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_name text NOT NULL,
    tenant_code text NOT NULL UNIQUE,
    status text DEFAULT 'ACTIVE' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Insert the Production Tenant "MEDD"
INSERT INTO public.tenants (tenant_name, tenant_code, status)
VALUES ('Medical Education and Drugs Department', 'MEDD', 'ACTIVE')
ON CONFLICT (tenant_code) DO UPDATE 
SET tenant_name = EXCLUDED.tenant_name;

-- 3. Ensure Organisation "GMCA" exists
-- (Already exists in your project, but adding just in case)
INSERT INTO public.organisations (organisation_name)
VALUES ('Government Medical College Akola')
ON CONFLICT DO NOTHING;

-- 4. Simple Permission Fix
GRANT ALL ON public.tenants TO anon, authenticated, service_role;

RAISE NOTICE 'Public setup complete. You can now use the Tenant Management UI.';
