-- ============================================
-- 0015_seed_global_workflow
-- Seed a Global Template for Tenants to Clone
-- ============================================

-- Create a dummy user for 'SYSTEM' if none exists or bypass if not strictly required
-- Here we'll just insert directly into the workflow tables

do $$
declare
    v_template_id uuid := gen_random_uuid();
    v_step1_id uuid := gen_random_uuid();
    v_step2_id uuid := gen_random_uuid();
    v_step3_id uuid := gen_random_uuid();
begin

    -- 1. Insert Global Template Workflow
    insert into public.sop_workflow (
        workflow_id, 
        workflow_name, 
        status, 
        scope, 
        is_template,
        created_at
    ) values (
        v_template_id,
        'Standard Purchase Order Process',
        'PUBLISHED',
        'GLOBAL',
        true,
        now()
    );

    -- 2. Insert Standardized Steps
    
    -- Step 3: Final Approval (No Next Step)
    insert into public.sop_step (sop_step_id, sop_id, step_order, step_description, next_step_on_approve)
    values (v_step3_id, v_template_id, 3, 'Finance Final Approval', null);

    -- Step 2: HOD Approval (points to Step 3)
    insert into public.sop_step (sop_step_id, sop_id, step_order, step_description, next_step_on_approve)
    values (v_step2_id, v_template_id, 2, 'HOD Technical Review', v_step3_id);

    -- Step 1: Initial Request (points to Step 2)
    insert into public.sop_step (sop_step_id, sop_id, step_order, step_description, next_step_on_approve)
    values (v_step1_id, v_template_id, 1, 'Initiate Purchase Request', v_step2_id);

end;
$$;
