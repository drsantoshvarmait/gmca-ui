-- Fix permissions for Master Units and Sub-Units
-- Ensure USAGE on public schema (usually already granted but being explicit)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions to master tables in public schema
GRANT ALL ON TABLE public.master_organisation_units TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.master_organisation_sub_units TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.master_unit_sub_unit_defaults TO anon, authenticated, service_role;

-- Re-confirm RLS policies are active and inclusive
ALTER TABLE public.master_organisation_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view master units" ON public.master_organisation_units;
CREATE POLICY "Anyone can view master units"
ON public.master_organisation_units FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage master units" ON public.master_organisation_units;
CREATE POLICY "Authenticated users can manage master units"
ON public.master_organisation_units FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure anon can also view if needed (optional based on app logic, but let's be safe for now)
DROP POLICY IF EXISTS "Anon can view master units" ON public.master_organisation_units;
CREATE POLICY "Anon can view master units"
ON public.master_organisation_units FOR SELECT
TO anon
USING (true);
