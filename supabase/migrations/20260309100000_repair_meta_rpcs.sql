-- =====================================================
-- REPAIR METADATA RPCs
-- Purpose: Provide stable RPCs for Admin Console views
-- Author: Antigravity
-- =====================================================

-- 1. Get Tables (SchemaView)
CREATE OR REPLACE FUNCTION public.sgv_get_schema_tables()
RETURNS TABLE (table_name text, schema text) 
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT table_name::text, table_schema::text as schema
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')
    ORDER BY table_schema, table_name;
$$;

-- 2. Get Functions (FunctionsView)
CREATE OR REPLACE FUNCTION public.sgv_get_functions()
RETURNS TABLE (function_name text, schema text, routine_name text) 
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT routine_name::text as function_name, routine_schema::text as schema, routine_name::text
    FROM information_schema.routines 
    WHERE routine_schema NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')
    AND routine_type = 'FUNCTION'
    ORDER BY routine_schema, routine_name;
$$;

-- 3. Get Triggers (TriggersView)
CREATE OR REPLACE FUNCTION public.sgv_get_triggers()
RETURNS TABLE (trigger_name text, table_name text, schema text) 
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT trigger_name::text, event_object_table::text as table_name, trigger_schema::text as schema
    FROM information_schema.triggers 
    WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')
    ORDER BY trigger_schema, trigger_name;
$$;

-- 4. Get RLS Policies (RLSView)
CREATE OR REPLACE FUNCTION public.sgv_get_rls_policies()
RETURNS TABLE (policy_name text, table_name text, schema text, cmd text) 
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT policyname::text as policy_name, tablename::text as table_name, schemaname::text as schema, cmd::text
    FROM pg_policies
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')
    ORDER BY schemaname, tablename, policyname;
$$;

-- 5. Get RPC Contracts (RpcContractsView)
CREATE OR REPLACE FUNCTION public.sgv_get_rpc_contracts()
RETURNS TABLE (function_name text, argument_types text, return_type text) 
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT 
        p.proname::text as function_name,
        pg_get_function_arguments(p.oid)::text as argument_types,
        pg_get_function_result(p.oid)::text as return_type
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')
    ORDER BY n.nspname, p.proname;
$$;

-- 6. Meta Summary (MetaDashboard)
CREATE OR REPLACE FUNCTION public.sgv_get_meta_summary()
RETURNS jsonb 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'tables_count', (SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')),
        'functions_count', (SELECT count(*) FROM information_schema.routines WHERE routine_schema NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')),
        'policies_count', (SELECT count(*) FROM pg_policies WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')),
        'triggers_count', (SELECT count(*) FROM information_schema.triggers WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog', 'storage', 'auth', 'graphql', 'realtime')),
        'last_refreshed_at', now()
    ) INTO result;
    RETURN result;
END;
$$;

-- Grant access to authenticated users for discovery
GRANT EXECUTE ON FUNCTION public.sgv_get_schema_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sgv_get_functions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sgv_get_triggers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sgv_get_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sgv_get_rpc_contracts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sgv_get_meta_summary() TO authenticated;
