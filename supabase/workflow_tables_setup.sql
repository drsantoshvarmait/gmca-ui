-- ============================================
-- BASE WORKFLOW SCHEMA & MULTI-TENANT UPGRADE
-- Execute this script in your Supabase SQL Editor
-- ============================================

-- 1. Create Base sop_workflow table
create table if not exists public.sop_workflow (
    workflow_id uuid primary key default gen_random_uuid(),
    workflow_name text not null,
    status text not null default 'DRAFT',
    created_at timestamptz default now()
);

-- 2. Create Base sop_step table
create table if not exists public.sop_step (
    sop_step_id uuid primary key default gen_random_uuid(),
    sop_id uuid not null references public.sop_workflow(workflow_id) on delete cascade,
    step_order integer not null,
    step_description text not null,
    next_step_on_approve uuid references public.sop_step(sop_step_id) on delete set null,
    created_at timestamptz default now()
);

-- 3. Upgrade sop_workflow for Tenant & Org isolation
alter table public.sop_workflow
add column if not exists tenant_id uuid references public.tenants(tenant_id),
add column if not exists organisation_id uuid references public.organisations(organisation_id),
add column if not exists is_template boolean default false,
add column if not exists scope text check (scope in ('GLOBAL', 'TENANT', 'LOCAL')) default 'TENANT';

create index if not exists idx_sop_workflow_tenant on public.sop_workflow(tenant_id);
create index if not exists idx_sop_workflow_org on public.sop_workflow(organisation_id);

-- 4. Upgrade sop_step for consistency (redundant tenant_id for performance/RLS)
alter table public.sop_step
add column if not exists tenant_id uuid references public.tenants(tenant_id);

create index if not exists idx_sop_step_tenant on public.sop_step(tenant_id);

-- 5. Enable RLS and Basic Access
alter table public.sop_workflow enable row level security;
alter table public.sop_step enable row level security;

-- Drop existing policies if they exist to avoid errors
drop policy if exists "Users can view their tenant or global workflows" on public.sop_workflow;
drop policy if exists "Tenant Admins can manage their workflows" on public.sop_workflow;
drop policy if exists "Users can view steps within their tenant or globally" on public.sop_step;
drop policy if exists "Enable all access during development" on public.sop_workflow;
drop policy if exists "Enable all access during development" on public.sop_step;

-- (For ease of development testing, you can temporarily allow full access to authenticated users)
create policy "Enable all access during development" on public.sop_workflow for all to authenticated using (true);
create policy "Enable all access during development" on public.sop_step for all to authenticated using (true);


-- 6. Stored Procedure to safely clone SOPs
create or replace function public.clone_workflow(
    p_source_workflow_id uuid,
    p_new_name text,
    p_new_scope text default 'TENANT'
) returns uuid as $$
declare
    v_new_workflow_id uuid;
    v_current_tenant_id uuid;
begin
    -- Extract tenant_id from JWT
    v_current_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

    -- 1. Create new workflow
    v_new_workflow_id := gen_random_uuid();
    
    insert into public.sop_workflow (workflow_id, workflow_name, status, tenant_id, scope, is_template)
    select v_new_workflow_id, p_new_name, 'DRAFT', v_current_tenant_id, p_new_scope, false
    from public.sop_workflow
    where workflow_id = p_source_workflow_id;

    -- 2. Create a temporary mapping of old steps to new steps
    create temp table step_mapping on commit drop as
    select sop_step_id as old_id, gen_random_uuid() as new_id
    from public.sop_step
    where sop_id = p_source_workflow_id;

    -- 3. Insert the cloned steps, mapping connections
    insert into public.sop_step (sop_step_id, sop_id, step_order, step_description, next_step_on_approve, tenant_id)
    select 
        m.new_id, 
        v_new_workflow_id, 
        s.step_order, 
        s.step_description, 
        m_next.new_id,
        v_current_tenant_id
    from public.sop_step s
    join step_mapping m on s.sop_step_id = m.old_id
    left join step_mapping m_next on s.next_step_on_approve = m_next.old_id
    where s.sop_id = p_source_workflow_id;

    return v_new_workflow_id;
end;
$$ language plpgsql security definer;


-- 7. Seed a Global Template Workflow
do $$
declare
    v_template_id uuid := gen_random_uuid();
    v_step1_id uuid := gen_random_uuid();
    v_step2_id uuid := gen_random_uuid();
    v_step3_id uuid := gen_random_uuid();
begin
    -- Ensure we don't duplicate on multiple runs
    if not exists (select 1 from public.sop_workflow where workflow_name = 'Standard Purchase Order Process') then
        
        insert into public.sop_workflow (workflow_id, workflow_name, status, scope, is_template) 
        values (v_template_id, 'Standard Purchase Order Process', 'PUBLISHED', 'GLOBAL', true);

        insert into public.sop_step (sop_step_id, sop_id, step_order, step_description, next_step_on_approve)
        values (v_step3_id, v_template_id, 3, 'Finance Final Approval', null);

        insert into public.sop_step (sop_step_id, sop_id, step_order, step_description, next_step_on_approve)
        values (v_step2_id, v_template_id, 2, 'HOD Technical Review', v_step3_id);

        insert into public.sop_step (sop_step_id, sop_id, step_order, step_description, next_step_on_approve)
        values (v_step1_id, v_template_id, 1, 'Initiate Purchase Request', v_step2_id);
    
    end if;
end;
$$;
