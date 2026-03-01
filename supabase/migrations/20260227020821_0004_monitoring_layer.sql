-- ============================================
-- 0004_monitoring_layer
-- Monitoring & Reporting Intelligence
-- ============================================

create schema if not exists monitoring;

-- =====================================================
-- 1️⃣ OVERDUE TASKS VIEW
-- =====================================================

create or replace view monitoring.overdue_tasks as
select
    t.id as task_id,
    t.tenant_id,
    t.title,
    t.status,
    t.priority,
    t.due_date,
    now() - t.due_date as overdue_duration
from task.tasks t
where t.due_date is not null
  and t.due_date < now()
  and t.status not in ('completed', 'cancelled');


-- =====================================================
-- 2️⃣ SLA BREACHED TASKS VIEW
-- =====================================================

create or replace view monitoring.sla_breached_tasks as
select
    t.id as task_id,
    t.tenant_id,
    t.title,
    s.breached,
    s.evaluated_at
from task.tasks t
join task.task_sla s on s.task_id = t.id
where s.breached = true;


-- =====================================================
-- 3️⃣ USER WORKLOAD VIEW
-- =====================================================

create or replace view monitoring.user_workload as
select
    a.tenant_id,
    a.assigned_to as user_id,
    count(*) as total_assigned,
    count(*) filter (where t.status = 'open') as open_tasks,
    count(*) filter (where t.status = 'in_progress') as in_progress_tasks,
    count(*) filter (where t.status = 'completed') as completed_tasks
from task.task_assignments a
join task.tasks t on t.id = a.task_id
group by a.tenant_id, a.assigned_to;


-- =====================================================
-- 4️⃣ TENANT TASK SUMMARY VIEW
-- =====================================================

create or replace view monitoring.tenant_task_summary as
select
    t.tenant_id,
    count(*) as total_tasks,
    count(*) filter (where t.status = 'open') as open_tasks,
    count(*) filter (where t.status = 'in_progress') as in_progress_tasks,
    count(*) filter (where t.status = 'completed') as completed_tasks,
    count(*) filter (where t.status = 'cancelled') as cancelled_tasks
from task.tasks t
group by t.tenant_id;


-- =====================================================
-- 5️⃣ PERFORMANCE INDEXES
-- =====================================================

create index if not exists idx_tasks_due_date
on task.tasks(due_date);

create index if not exists idx_tasks_priority
on task.tasks(priority);

create index if not exists idx_assignments_tenant
on task.task_assignments(tenant_id);

create index if not exists idx_sla_breached
on task.task_sla(breached);


-- =====================================================
-- 6️⃣ ENABLE RLS FOR MONITORING VIEWS
-- =====================================================

alter view monitoring.overdue_tasks owner to postgres;
alter view monitoring.sla_breached_tasks owner to postgres;
alter view monitoring.user_workload owner to postgres;
alter view monitoring.tenant_task_summary owner to postgres;