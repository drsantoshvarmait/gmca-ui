-- =========================================
-- 0015_hierarchical_masters.sql
-- Hierarchical Master Selection Logic
-- Superadmin -> Tenant Admin -> Org Admin
-- =========================================

-- 1. Tenant Level Selections
CREATE TABLE IF NOT EXISTS core.tenant_master_selections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    master_type text NOT NULL, -- 'unit', 'sub_unit', 'item', 'vendor', etc.
    master_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, master_type, master_id)
);

-- 2. Organisation Level Selections
CREATE TABLE IF NOT EXISTS core.organisation_master_selections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organisation_id uuid REFERENCES core.organisations(organisation_id) ON DELETE CASCADE,
    master_type text NOT NULL,
    master_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(organisation_id, master_type, master_id)
);

-- RLS
ALTER TABLE core.tenant_master_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organisation_master_selections ENABLE ROW LEVEL SECURITY;

-- Policies for tenant_master_selections
DROP POLICY IF EXISTS "Superadmins can manage all tenant selections" ON core.tenant_master_selections;
CREATE POLICY "Superadmins can manage all tenant selections"
ON core.tenant_master_selections FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM core.profiles
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
);

DROP POLICY IF EXISTS "Tenant admins can manage their own selections" ON core.tenant_master_selections;
CREATE POLICY "Tenant admins can manage their own selections"
ON core.tenant_master_selections FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM core.profiles WHERE id = auth.uid())
);

-- Policies for organisation_master_selections
DROP POLICY IF EXISTS "Superadmins can manage all org selections" ON core.organisation_master_selections;
CREATE POLICY "Superadmins can manage all org selections"
ON core.organisation_master_selections FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM core.profiles
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
);

DROP POLICY IF EXISTS "Tenant admins can view/manage org selections in their tenant" ON core.organisation_master_selections;
CREATE POLICY "Tenant admins can view/manage org selections in their tenant"
ON core.organisation_master_selections FOR ALL
TO authenticated
USING (
    organisation_id IN (
        SELECT organisation_id FROM core.organisations
        WHERE tenant_id = (SELECT tenant_id FROM core.profiles WHERE id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Org admins can manage their own selections" ON core.organisation_master_selections;
CREATE POLICY "Org admins can manage their own selections"
ON core.organisation_master_selections FOR ALL
TO authenticated
USING (
    organisation_id IN (
        SELECT organisation_id FROM public.user_org_roles
        WHERE user_id = auth.uid()
    )
);
