-- ============================================
-- 0014_unify_tenant_schemas
-- Synchronize 'core' and 'public' tenant tables
-- ============================================

CREATE SCHEMA IF NOT EXISTS core;

-- 1. Ensure core.tenants has the same structure as public.tenants
CREATE TABLE IF NOT EXISTS core.tenants (
    tenant_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_name text NOT NULL,
    tenant_code text NOT NULL UNIQUE,
    status text DEFAULT 'ACTIVE' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- If core.tenants exists but lacks tenant_id (legacy fix)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'tenants' AND column_name = 'id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'tenants' AND column_name = 'tenant_id') THEN
        ALTER TABLE core.tenants RENAME COLUMN id TO tenant_id;
    END IF;
END $$;

-- 2. Sync data from public.tenants to core.tenants (if any)
INSERT INTO core.tenants (tenant_id, tenant_name, tenant_code, status, created_at)
SELECT tenant_id, tenant_name, tenant_code, 'ACTIVE' as status, now() as created_at
FROM public.tenants
ON CONFLICT (tenant_code) DO NOTHING;

-- 3. Sync organisations
CREATE TABLE IF NOT EXISTS core.organisations (
    organisation_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organisation_name text NOT NULL,
    organisation_code text NOT NULL UNIQUE,
    tenant_id uuid REFERENCES core.tenants(tenant_id),
    status text DEFAULT 'ACTIVE' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO core.organisations (organisation_id, organisation_name, organisation_code, tenant_id, status, created_at)
SELECT organisation_id, organisation_name, organisation_code, tenant_id, 'ACTIVE' as status, now() as created_at
FROM public.organisations
ON CONFLICT (organisation_code) DO NOTHING;

-- 4. Ensure public.tenants also stays synced if migrations use core
-- (Creating a view or trigger is optional, but for now we just ensure core is ready for the FKs)
