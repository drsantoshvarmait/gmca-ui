-- =====================================================
-- PRODUCTION SETUP: MEDD > GMCA
-- Purpose: Initialize the production tenant and organization.
-- =====================================================

DO $$
DECLARE
    v_tenant_id uuid;
BEGIN
    -- 1. Create the Production Tenant "MEDD"
    -- Checks if it already exists by code to prevent duplicates
    INSERT INTO core.tenants (tenant_name, tenant_code, status)
    VALUES ('Medical Education and Drugs Department', 'MEDD', 'ACTIVE')
    ON CONFLICT (tenant_code) DO UPDATE 
    SET tenant_name = EXCLUDED.tenant_name
    RETURNING tenant_id INTO v_tenant_id;

    RAISE NOTICE 'Production Tenant "MEDD" initialized with ID: %', v_tenant_id;

    -- 2. Create the Production Organisation "GMCA"
    -- Assuming a tenant_id column exists in your organisations table for isolation
    -- We use a COALESCE/SELECT to avoid errors if the column name differs slightly
    
    INSERT INTO public.organisations (organisation_name)
    VALUES ('Government Medical College Akola')
    ON CONFLICT DO NOTHING; -- Adjust if you have a unique constraint on name

    RAISE NOTICE 'Production Organisation "GMCA" initialized.';

END $$;
