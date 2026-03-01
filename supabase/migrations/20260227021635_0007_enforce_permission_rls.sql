-- ============================================
-- 0007_enforce_permission_rls
-- Database-Level Permission Enforcement
-- ============================================

-- =====================================================
-- 1️⃣ HELPER FUNCTION: CURRENT USER ID FROM JWT
-- =====================================================

create or replace function core.current_user_id()
returns uuid as $$
begin
    return (auth.jwt() ->> 'sub')::uuid;
end;
$$ language plpgsql stable;


-- =====================================================
-- 2️⃣ ENFORCE TASK INSERT (TASK_CREATE)
-- =====================================================

drop policy if exists task_insert_policy on task.tasks;

create policy task_insert_policy
on task.tasks
for insert
with check (
    core.has_permission(core.current_user_id(), 'TASK_CREATE')
);


-- =====================================================
-- 3️⃣ ENFORCE TASK UPDATE (TASK_UPDATE)
-- =====================================================

drop policy if exists task_update_policy on task.tasks;

create policy task_update_policy
on task.tasks
for update
using (
    core.has_permission(core.current_user_id(), 'TASK_UPDATE')
);


-- =====================================================
-- 4️⃣ ENFORCE TASK SELECT (TASK_VIEW)
-- =====================================================

drop policy if exists task_select_policy on task.tasks;

create policy task_select_policy
on task.tasks
for select
using (
    core.has_permission(core.current_user_id(), 'TASK_VIEW')
);


-- =====================================================
-- 5️⃣ ENFORCE TASK ASSIGNMENT INSERT (TASK_ASSIGN)
-- =====================================================

drop policy if exists task_assign_insert_policy on task.task_assignments;

create policy task_assign_insert_policy
on task.task_assignments
for insert
with check (
    core.has_permission(core.current_user_id(), 'TASK_ASSIGN')
);


-- =====================================================
-- 6️⃣ ENFORCE TASK ESCALATION (TASK_ESCALATE)
-- =====================================================

drop policy if exists task_escalation_insert_policy on task.task_escalations;

create policy task_escalation_insert_policy
on task.task_escalations
for insert
with check (
    core.has_permission(core.current_user_id(), 'TASK_ESCALATE')
);