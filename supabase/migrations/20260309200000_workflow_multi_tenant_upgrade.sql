-- ============================================
-- 0013_workflow_multi_tenant_upgrade
-- Multi-Tenant Workflow & Org-Specific SOPs
-- ============================================

-- 1. Upgrade sop_workflow for Tenant & Org isolation
alter table public.sop_workflow
add column if not exists tenant_id uuid references public.tenants(tenant_id),
add column if not exists organisation_id uuid references public.organisations(organisation_id),
add column if not exists is_template boolean default false,
add column if not exists scope text check (scope in ('GLOBAL', 'TENANT', 'LOCAL')) default 'TENANT';

create index if not exists idx_sop_workflow_tenant on public.sop_workflow(tenant_id);
create index if not exists idx_sop_workflow_org on public.sop_workflow(organisation_id);

-- 2. Upgrade sop_step for consistency (redundant tenant_id for performance/RLS)
alter table public.sop_step
add column if not exists tenant_id uuid references public.tenants(tenant_id);

create index if not exists idx_sop_step_tenant on public.sop_step(tenant_id);

-- 3. Update RLS for sop_workflow
alter table public.sop_workflow enable row level security;

create policy "Users can view their tenant or global workflows"
on public.sop_workflow for select
to authenticated
using (
    scope = 'GLOBAL' 
    or tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

create policy "Tenant Admins can manage their workflows"
on public.sop_workflow for all
to authenticated
using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and exists (
        select 1 from core.profiles
        where id = auth.uid()
        and (role = 'admin' or role = 'SUPER_ADMIN')
    )
);

-- 4. Update RLS for sop_step
alter table public.sop_step enable row level security;

create policy "Users can view steps within their tenant or globally"
on public.sop_step for select
to authenticated
using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    or exists (
        select 1 from public.sop_workflow w
        where w.workflow_id = sop_step.sop_id
        and w.scope = 'GLOBAL'
    )
);
