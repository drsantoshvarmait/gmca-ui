-- =========================================
-- CORE DESIGNATIONS & MISSING ENTITIES RECOVERY
-- =========================================

-- 1. Create designations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.designations (
    designation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add sample designations
INSERT INTO public.designations (designation_name, description)
VALUES 
    ('Super Admin', 'Full system access'),
    ('Unit Officer', 'Organisation unit head'),
    ('Finance Manager', 'Budget and expense approval'),
    ('Procurement Head', 'Inventory and vendor management')
ON CONFLICT DO NOTHING;

-- 3. Ensure profiles has role support
ALTER TABLE core.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER';

-- 4. Enable RLS on designations
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Designations are viewable by everyone" ON public.designations;
CREATE POLICY "Designations are viewable by everyone" ON public.designations FOR SELECT USING (true);
