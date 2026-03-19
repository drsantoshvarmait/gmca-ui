import pkg from 'pg';
const { Client } = pkg;

const STAGING = {
    host: 'db.risrmpdbvoafowdvnonn.supabase.co',
    port: 6543,
    user: 'postgres.risrmpdbvoafowdvnonn',
    password: process.env.STAGING_SUPABASE_DB_PASSWORD || 'Annuji1*4713',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const compatibilitySql = `
BEGIN;
CREATE SCHEMA IF NOT EXISTS core;
CREATE TABLE IF NOT EXISTS core.tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name TEXT NOT NULL,
    tenant_code TEXT NOT NULL UNIQUE,
    tenant_type TEXT DEFAULT 'GOVERNMENT',
    status TEXT DEFAULT 'ACTIVE',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$ BEGIN ALTER TABLE core.tenants ADD COLUMN tenant_type TEXT DEFAULT 'GOVERNMENT'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE core.tenants ADD COLUMN settings JSONB DEFAULT '{}'::jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    role TEXT DEFAULT 'USER',
    tenant_id UUID REFERENCES core.tenants(tenant_id),
    preferred_language_code TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$ BEGIN ALTER TABLE core.profiles ADD COLUMN preferred_language_code TEXT DEFAULT 'en'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE core.profiles ADD COLUMN tenant_id UUID REFERENCES core.tenants(tenant_id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    message TEXT,
    type TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants' AND table_type = 'VIEW') THEN
        DROP VIEW public.tenants CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name TEXT NOT NULL,
    tenant_code TEXT NOT NULL UNIQUE,
    tenant_type TEXT DEFAULT 'GOVERNMENT',
    status TEXT DEFAULT 'ACTIVE',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION sync_to_core_tenants() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO core.tenants (tenant_id, tenant_name, tenant_code, tenant_type, status, settings, created_at, updated_at)
    VALUES (NEW.tenant_id, NEW.tenant_name, NEW.tenant_code, NEW.tenant_type, NEW.status, NEW.settings, NEW.created_at, NEW.updated_at)
    ON CONFLICT (tenant_id) DO UPDATE SET
        tenant_name = EXCLUDED.tenant_name,
        tenant_code = EXCLUDED.tenant_code,
        tenant_type = EXCLUDED.tenant_type,
        status = EXCLUDED.status,
        settings = EXCLUDED.settings,
        updated_at = EXCLUDED.updated_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_tenants ON public.tenants;
CREATE TRIGGER tr_sync_tenants AFTER INSERT OR UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION sync_to_core_tenants();

CREATE TABLE IF NOT EXISTS public.organisation_types (
    organisation_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_type TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organisations (
    organisation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_name TEXT NOT NULL,
    organisation_code TEXT UNIQUE,
    organisation_type TEXT,
    organisation_type_id UUID REFERENCES public.organisation_types(organisation_type_id),
    tenant_id UUID REFERENCES core.tenants(tenant_id),
    parent_organisation_id UUID REFERENCES public.organisations(organisation_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_org_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    organisation_id UUID REFERENCES public.organisations(organisation_id),
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comm_subject (
    subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES public.organisations(organisation_id),
    subject_status TEXT DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS public.letters (
    letter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES public.organisations(organisation_id),
    status TEXT DEFAULT 'Draft'
);

CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM core.profiles;

DROP VIEW IF EXISTS public.v_notifications;
CREATE OR REPLACE VIEW public.v_notifications AS 
SELECT id, user_id, COALESCE(type, 'Notification') as title, message, read as is_read, created_at 
FROM core.notifications;

DROP VIEW IF EXISTS public.v_workflow_health_dashboard;
CREATE OR REPLACE VIEW public.v_workflow_health_dashboard AS 
SELECT 0 as tasks_in_progress, 0 as tasks_completed, 0 as possible_sla_breach;

ALTER TABLE public.organisation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_org_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read types' AND tablename = 'organisation_types') THEN
        CREATE POLICY "Allow public read types" ON public.organisation_types FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public tenants are manageable' AND tablename = 'tenants') THEN
        CREATE POLICY "Public tenants are manageable" ON public.tenants FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their orgs' AND tablename = 'organisations') THEN
        CREATE POLICY "Users can manage their orgs" ON public.organisations FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow role access' AND tablename = 'user_org_roles') THEN
        CREATE POLICY "Allow role access" ON public.user_org_roles FOR ALL USING (true);
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA core TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON core.tenants TO anon, authenticated;
GRANT ALL ON core.profiles TO anon, authenticated;
GRANT ALL ON core.notifications TO anon, authenticated;

INSERT INTO public.organisation_types (organisation_type) VALUES ('Administrative Unit') ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
COMMIT;
`;

async function runMigration(config, name) {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Applying compatibility layer to " + name + "...");
        await client.query(compatibilitySql);
        
        const userRes = await client.query("SELECT id FROM auth.users WHERE email = 'drsantoshvarmait@gmail.com'");
        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            console.log("Elevating " + name + " admin user...");
            await client.query("UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1", [userId]);
            await client.query("INSERT INTO core.profiles (id, email, role) VALUES ($1, 'drsantoshvarmait@gmail.com', 'SUPER_ADMIN') ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN'", [userId]);
            console.log("✅ Admin elevated in " + name + ".");
        } else {
            console.log("⚠️ User not found in " + name + ".");
        }

    } catch (err) {
        console.error("❌ Error in " + name + ":", err.message);
    } finally {
        await client.end();
    }
}

async function main() {
    await runMigration(STAGING, 'STAGING');
}

main();
