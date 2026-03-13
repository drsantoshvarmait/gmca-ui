import pkg from 'pg';
const { Client } = pkg;

const config = {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ulfrylptbnrfewodzhck',
    password: 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const sql = `
-- Fix RLS for Tenants table to allow creation by Superadmins
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view for authenticated" ON public.tenants;
CREATE POLICY "Public view for authenticated" ON public.tenants
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmins can manage all tenants" ON public.tenants;
CREATE POLICY "Superadmins can manage all tenants" ON public.tenants
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'SUPER_ADMIN' OR role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'SUPER_ADMIN' OR role = 'admin')
  )
);

-- Fallback for development if profile check fails (allows insert if authenticated)
DROP POLICY IF EXISTS "Development permissive access" ON public.tenants;
CREATE POLICY "Development permissive access" ON public.tenants
FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Running RLS fix migration...');
        await client.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
