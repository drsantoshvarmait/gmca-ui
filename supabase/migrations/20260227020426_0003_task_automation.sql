-- ============================================
-- 0003_task_automation
-- Intelligent Task Behavior Layer
-- ============================================

-- =====================================================
-- 1️⃣ AUTO updated_at TRIGGER
-- =====================================================

create or replace function task.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_tasks_updated_at
before update on task.tasks
for each row
execute function task.set_updated_at();


-- =====================================================
-- 2️⃣ STATUS CHANGE HISTORY TRIGGER
-- =====================================================

create or replace function task.log_status_change()
returns trigger as $$
begin
    if old.status is distinct from new.status then
        insert into task.task_status_history (
            id,
            tenant_id,
            task_id,
            old_status,
            new_status,
            changed_by,
            changed_at
        )
        values (
            uuid_generate_v4(),
            new.tenant_id,
            new.id,
            old.status,
            new.status,
            new.created_by,
            now()
        );
    end if;

    return new;
end;
$$ language plpgsql;

create trigger trg_task_status_history
after update on task.tasks
for each row
execute function task.log_status_change();


-- =====================================================
-- 3️⃣ SLA BREACH EVALUATION FUNCTION
-- =====================================================

create or replace function task.evaluate_sla(p_task_id uuid)
returns void as $$
declare
    v_due timestamptz;
begin
    select due_date into v_due
    from task.tasks
    where id = p_task_id;

    if v_due is not null and v_due < now() then
        update task.task_sla
        set breached = true,
            evaluated_at = now()
        where task_id = p_task_id;
    end if;
end;
$$ language plpgsql;


-- =====================================================
-- 4️⃣ AUTO CREATE SLA RECORD ON TASK INSERT
-- =====================================================

create or replace function task.create_sla_record()
returns trigger as $$
begin
    insert into task.task_sla (
        id,
        tenant_id,
        task_id,
        sla_hours
    )
    values (
        uuid_generate_v4(),
        new.tenant_id,
        new.id,
        48
    );

    return new;
end;
$$ language plpgsql;

create trigger trg_create_sla
after insert on task.tasks
for each row
execute function task.create_sla_record();


-- =====================================================
-- 5️⃣ ESCALATION STUB FUNCTION (Future Ready)
-- =====================================================

create or replace function task.escalate_task(p_task_id uuid)
returns void as $$
begin
    insert into task.task_escalations (
        id,
        tenant_id,
        task_id,
        escalation_level,
        reason,
        escalated_at
    )
    select
        uuid_generate_v4(),
        t.tenant_id,
        t.id,
        1,
        'Auto escalation due to SLA breach',
        now()
    from task.tasks t
    where t.id = p_task_id;
end;
$$ language plpgsql;