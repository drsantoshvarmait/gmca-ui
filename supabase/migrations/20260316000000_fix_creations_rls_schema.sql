-- =========================================
-- FIX: TENANT & ORG CREATION
-- Resolves RLS and Schema issues discovered during verification
-- =========================================

-- 1. Fix core.tenants RLS for Superadmins
-- The default tenant_isolation_tenants policy was too restrictive
DROP POLICY IF EXISTS tenant_isolation_tenants ON core.tenants;
CREATE POLICY "Allow superadmins to manage all tenants"
ON core.tenants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM core.profiles
    WHERE id = auth.uid()
    AND (role = 'SUPER_ADMIN' OR role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM core.profiles
    WHERE id = auth.uid()
    AND (role = 'SUPER_ADMIN' OR role = 'admin')
  )
);

-- 2. Add fallback for regular users (selection)
CREATE POLICY "Allow authenticated users to view tenants"
ON core.tenants
FOR SELECT
TO authenticated
USING (true);

-- 3. Fix public.organisations Schema
-- The UI expects these columns for registration
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS organisation_code TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS organisation_type TEXT;

-- Index for unique code to prevent duplicate registrations
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_org_code_legacy') THEN
        CREATE UNIQUE INDEX idx_org_code_legacy ON public.organisations(organisation_code);
    END IF;
END $$;

-- 4. Fix Organisations RLS
-- Allow Superadmins to see and manage everything
DROP POLICY IF EXISTS "Tenant isolation orgs" ON public.organisations;
DROP POLICY IF EXISTS "Allow superadmins to manage all orgs" ON public.organisations;

CREATE POLICY "Allow superadmins to manage all orgs"
ON public.organisations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM core.profiles
    WHERE id = auth.uid()
    AND (role = 'SUPER_ADMIN' OR role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM core.profiles
    WHERE id = auth.uid()
    AND (role = 'SUPER_ADMIN' OR role = 'admin')
  )
);

-- Preserve Tenant Isolation for regular users/admins
CREATE POLICY "Tenant isolation orgs" 
ON public.organisations 
FOR ALL 
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    OR 
    (EXISTS (
        SELECT 1 FROM core.profiles
        WHERE id = auth.uid()
        AND (role = 'SUPER_ADMIN' OR role = 'admin')
    ))
);
