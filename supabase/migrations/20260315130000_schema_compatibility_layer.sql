-- =========================================
-- SCHEMA COMPATIBILITY LAYER
-- Maps 'core' tables to 'public' for legacy UI support
-- =========================================

-- 1. Profiles (Expose core.profiles to public)
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    id,
    email,
    role,
    tenant_id,
    created_at,
    -- Add fallback for preferred_language_code if missing in core.profiles
    'en'::text as preferred_language_code
FROM core.profiles;

-- Allow public access if RLS on core.profiles is set
-- We don't need additional RLS on the view if the underlying table has it.

-- 2. Notifications (Expose core.notifications to public)
CREATE OR REPLACE VIEW public.v_notifications AS
SELECT * FROM core.notifications;

-- 3. Workflow Health (Expose core metrics if needed)
-- The dashboard uses v_workflow_health_dashboard
-- Ensure it exists in public or its expected schema
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_workflow_health_dashboard') THEN
        -- Create a dummy view or link to the real one if it exists elsewhere
        NULL; 
    END IF;
END $$;
