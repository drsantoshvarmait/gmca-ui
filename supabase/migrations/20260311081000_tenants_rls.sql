-- Allow Superadmins to manage tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow superadmins to manage all tenants" ON public.tenants;
CREATE POLICY "Allow superadmins to manage all tenants"
ON public.tenants
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

-- Also allow basic visibility for authenticated users if needed for selection
DROP POLICY IF EXISTS "Allow authenticated users to view tenants" ON public.tenants;
CREATE POLICY "Allow authenticated users to view tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (true);
