-- ============================================
-- 0011_finance_module
-- Budgeting and Expense Tracking
-- ============================================

create schema if not exists finance;

-- =====================================================
-- BUDGET PERIODS
-- (Fiscal Years, Quarters, etc.)
-- =====================================================
create table if not exists finance.budget_periods (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references core.tenants(tenant_id) on delete cascade,
    
    name text not null, -- e.g., "FY2026", "Q1 2026"
    start_date date not null,
    end_date date not null,
    status text not null default 'DRAFT', -- DRAFT, OPEN, CLOSED
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint check_dates check (start_date < end_date)
);

do $$ begin
    if not exists (select 1 from pg_indexes where indexname = 'idx_budget_periods_tenant') then
        create index idx_budget_periods_tenant on finance.budget_periods(tenant_id);
    end if;
end $$;

-- =====================================================
-- BUDGET CATEGORIES
-- =====================================================
create table if not exists finance.budget_categories (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references core.tenants(tenant_id) on delete cascade,
    
    name text not null,
    description text,
    parent_id uuid references finance.budget_categories(id), -- For hierarchical categories
    
    created_at timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_indexes where indexname = 'idx_budget_categories_tenant') then
        create index idx_budget_categories_tenant on finance.budget_categories(tenant_id);
    end if;
end $$;

-- =====================================================
-- BUDGET ALLOCATIONS
-- (The actual "pot of money")
-- =====================================================
create table if not exists finance.budget_allocations (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references core.tenants(tenant_id) on delete cascade,
    
    period_id uuid not null references finance.budget_periods(id) on delete cascade,
    category_id uuid not null references finance.budget_categories(id) on delete cascade,
    
    amount decimal(19,4) not null default 0,
    currency text not null default 'USD',
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_indexes where indexname = 'idx_budget_allocations_period') then
        create index idx_budget_allocations_period on finance.budget_allocations(period_id);
    end if;
    if not exists (select 1 from pg_indexes where indexname = 'idx_budget_allocations_category') then
        create index idx_budget_allocations_category on finance.budget_allocations(category_id);
    end if;
end $$;

-- =====================================================
-- BUDGET EXPENSES
-- (The actual spend)
-- =====================================================
create table if not exists finance.budget_expenses (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references core.tenants(tenant_id) on delete cascade,
    
    allocation_id uuid not null references finance.budget_allocations(id) on delete cascade,
    task_id uuid references task.tasks(id) on delete set null, -- Optional link to a task
    
    amount decimal(19,4) not null,
    description text,
    expense_date date not null default current_date,
    status text not null default 'PENDING', -- PENDING, APPROVED, REJECTED
    
    receipt_url text, -- Storage link
    
    incurred_by uuid references core.app_users(user_id),
    approved_by uuid references core.app_users(user_id),
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_indexes where indexname = 'idx_budget_expenses_allocation') then
        create index idx_budget_expenses_allocation on finance.budget_expenses(allocation_id);
    end if;
    if not exists (select 1 from pg_indexes where indexname = 'idx_budget_expenses_task') then
        create index idx_budget_expenses_task on finance.budget_expenses(task_id);
    end if;
end $$;

-- =====================================================
-- ENABLE RLS
-- =====================================================
alter table finance.budget_periods enable row level security;
alter table finance.budget_categories enable row level security;
alter table finance.budget_allocations enable row level security;
alter table finance.budget_expenses enable row level security;

-- =====================================================
-- TENANT ISOLATION POLICIES
-- =====================================================
drop policy if exists tenant_isolation_budget_periods on finance.budget_periods;
create policy tenant_isolation_budget_periods
on finance.budget_periods for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

drop policy if exists tenant_isolation_budget_categories on finance.budget_categories;
create policy tenant_isolation_budget_categories
on finance.budget_categories for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

drop policy if exists tenant_isolation_budget_allocations on finance.budget_allocations;
create policy tenant_isolation_budget_allocations
on finance.budget_allocations for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

drop policy if exists tenant_isolation_budget_expenses on finance.budget_expenses;
create policy tenant_isolation_budget_expenses
on finance.budget_expenses for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
