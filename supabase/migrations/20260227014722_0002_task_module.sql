-- ============================================
-- 0002_task_module
-- Multi-Tenant Task Assignment + Monitoring
-- ============================================

create schema if not exists task;

-- =====================================================
-- TASKS
-- =====================================================
create table task.tasks (
    id uuid primary key default uuid_generate_v4(),

    tenant_id uuid not null
        references core.tenants(tenant_id) on delete cascade,

    title text not null,
    description text,

    priority text not null default 'normal',
    status text not null default 'open',

    due_date timestamptz,

    created_by uuid
        references core.app_users(user_id),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_tasks_tenant on task.tasks(tenant_id);
create index idx_tasks_status on task.tasks(status);


-- =====================================================
-- TASK ASSIGNMENTS
-- =====================================================
create table task.task_assignments (
    id uuid primary key default uuid_generate_v4(),

    tenant_id uuid not null
        references core.tenants(tenant_id) on delete cascade,

    task_id uuid not null
        references task.tasks(id) on delete cascade,

    assigned_to uuid not null
        references core.app_users(user_id),

    assigned_by uuid
        references core.app_users(user_id),

    assigned_at timestamptz not null default now()
);

create index idx_task_assignments_task on task.task_assignments(task_id);
create index idx_task_assignments_user on task.task_assignments(assigned_to);


-- =====================================================
-- TASK COMMENTS
-- =====================================================
create table task.task_comments (
    id uuid primary key default uuid_generate_v4(),

    tenant_id uuid not null
        references core.tenants(tenant_id) on delete cascade,

    task_id uuid not null
        references task.tasks(id) on delete cascade,

    comment text not null,

    commented_by uuid
        references core.app_users(user_id),

    commented_at timestamptz not null default now()
);

create index idx_task_comments_task on task.task_comments(task_id);


-- =====================================================
-- TASK STATUS HISTORY
-- =====================================================
create table task.task_status_history (
    id uuid primary key default uuid_generate_v4(),

    tenant_id uuid not null
        references core.tenants(tenant_id) on delete cascade,

    task_id uuid not null
        references task.tasks(id) on delete cascade,

    old_status text,
    new_status text not null,

    changed_by uuid
        references core.app_users(user_id),

    changed_at timestamptz not null default now()
);

create index idx_task_status_history_task
    on task.task_status_history(task_id);


-- =====================================================
-- SLA TRACKING
-- =====================================================
create table task.task_sla (
    id uuid primary key default uuid_generate_v4(),

    tenant_id uuid not null
        references core.tenants(tenant_id) on delete cascade,

    task_id uuid not null
        references task.tasks(id) on delete cascade,

    sla_hours integer not null default 48,

    breached boolean not null default false,
    evaluated_at timestamptz
);

create index idx_task_sla_task on task.task_sla(task_id);


-- =====================================================
-- ESCALATIONS
-- =====================================================
create table task.task_escalations (
    id uuid primary key default uuid_generate_v4(),

    tenant_id uuid not null
        references core.tenants(tenant_id) on delete cascade,

    task_id uuid not null
        references task.tasks(id) on delete cascade,

    escalated_to uuid
        references core.app_users(user_id),

    escalation_level integer not null default 1,
    reason text,

    escalated_at timestamptz not null default now()
);

create index idx_task_escalations_task
    on task.task_escalations(task_id);


-- =====================================================
-- ENABLE RLS
-- =====================================================
alter table task.tasks enable row level security;
alter table task.task_assignments enable row level security;
alter table task.task_comments enable row level security;
alter table task.task_status_history enable row level security;
alter table task.task_sla enable row level security;
alter table task.task_escalations enable row level security;


-- =====================================================
-- TENANT ISOLATION POLICIES
-- =====================================================
create policy tenant_isolation_tasks
on task.tasks
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenant_isolation_assignments
on task.task_assignments
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenant_isolation_comments
on task.task_comments
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenant_isolation_status_history
on task.task_status_history
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenant_isolation_sla
on task.task_sla
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenant_isolation_escalations
on task.task_escalations
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);