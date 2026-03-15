-- Governance Dashboard Views (FIXED)
BEGIN;

-- 1. Create v_admin_workflow_dashboard
CREATE OR REPLACE VIEW public.v_admin_workflow_dashboard AS
SELECT 
    (SELECT count(*) FROM public.sop_workflow WHERE status = 'PUBLISHED') as active_count,
    (SELECT count(*) FROM task.tasks WHERE status = 'PENDING') as pending_count,
    (SELECT count(*) FROM task.tasks WHERE due_date < now() AND status != 'COMPLETED') as overdue_count,
    (SELECT count(*) FROM task.task_escalations WHERE escalated_at >= current_date) as escalation_count,
    (SELECT count(*) FROM task.tasks WHERE status = 'COMPLETED') as completed_count;

-- 2. Create v_running_workflows_monitor
CREATE OR REPLACE VIEW public.v_running_workflows_monitor AS
SELECT 
    t.id::text as workflow_instance_id,
    p.full_name as person_id,
    t.created_at as started_at,
    (EXTRACT(EPOCH FROM (now() - t.created_at)) / 3600)::numeric(10,2) || ' hours' as elapsed_time,
    t.status as current_status,
    sw.workflow_name as workflow_type,
    ss.step_description as current_step
FROM task.tasks t
LEFT JOIN public.profiles p ON t.created_by = p.id
LEFT JOIN public.sop_step ss ON t.sop_step_id = ss.sop_step_id
LEFT JOIN public.sop_workflow sw ON ss.sop_id = sw.workflow_id
WHERE t.status != 'COMPLETED'
ORDER BY t.created_at DESC;

COMMIT;
