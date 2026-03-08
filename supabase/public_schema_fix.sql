-- =====================================================
-- COMPREHENSIVE PUBLIC SCHEMA SETUP (WIP)
-- Purpose: Move all custom modules to the 'public' schema
-- to bypass "Exposed Schema" configuration issues.
-- =====================================================

-- 1. TENANTS (Foundation)
CREATE TABLE IF NOT EXISTS public.tenants (
    tenant_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_name text NOT NULL,
    tenant_code text NOT NULL UNIQUE,
    status text DEFAULT 'ACTIVE' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. BUDGETING (Finance)
CREATE TABLE IF NOT EXISTS public.finance_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text NOT NULL DEFAULT 'OPEN',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    period_id uuid NOT NULL REFERENCES public.finance_periods(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.finance_categories(id) ON DELETE CASCADE,
    amount decimal(19,4) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    allocation_id uuid NOT NULL REFERENCES public.finance_allocations(id) ON DELETE CASCADE,
    amount decimal(19,4) NOT NULL,
    description text,
    expense_date date DEFAULT current_date,
    created_at timestamptz DEFAULT now()
);

-- 3. PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

RAISE NOTICE 'Migration to PUBLIC schema complete.';
