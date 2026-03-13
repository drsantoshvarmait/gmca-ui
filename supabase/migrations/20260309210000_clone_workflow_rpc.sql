-- ============================================
-- 0014_clone_workflow_rpc
-- Stored Procedure to safely clone SOPs
-- ============================================

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
