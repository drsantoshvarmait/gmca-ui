-- Enable RLS for Master Units
ALTER TABLE public.master_organisation_units ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view
CREATE POLICY "Anyone can view master units"
ON public.master_organisation_units FOR SELECT
TO authenticated
USING (true);

-- Allow superadmins to manage (assuming role based check exists in JWT)
-- For now, allowing all authenticated to manage for dev convenience, 
-- but normally would restrict to superadmin.
CREATE POLICY "Authenticated users can manage master units"
ON public.master_organisation_units FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
