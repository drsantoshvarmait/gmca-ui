-- Total Governance Architecture Migration
-- This migration ensures that every Task in the system belongs to an SOP Step.

BEGIN;

-- 1. Create the Universal Ad-hoc Workflow
-- Using a deterministic UUID for the "General Standard" so the UI can reference it easily.
INSERT INTO public.sop_workflow (workflow_id, workflow_name, status, is_template, scope)
VALUES ('00000000-0000-0000-0000-000000000001', 'Standard Ad-hoc Operations', 'active', true, 'GLOBAL')
ON CONFLICT (workflow_id) DO NOTHING;

-- 2. Create the Universal Ad-hoc Task Step
INSERT INTO public.sop_step (sop_step_id, sop_id, step_order, step_description)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 1, 'General Task Execution')
ON CONFLICT (sop_step_id) DO NOTHING;

-- 3. Prepare the tasks table
-- Adding the column first
ALTER TABLE task.tasks ADD COLUMN IF NOT EXISTS sop_step_id UUID;

-- 4. Backfill existing tasks to the Ad-hoc Step
UPDATE task.tasks 
SET sop_step_id = '00000000-0000-0000-0000-000000000002' 
WHERE sop_step_id IS NULL;

-- 5. Enforce the "Total Governance" constraint
-- We set it to NOT NULL and add the foreign key.
ALTER TABLE task.tasks ALTER COLUMN sop_step_id SET NOT NULL;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_task_sop_step') THEN
        ALTER TABLE task.tasks 
        ADD CONSTRAINT fk_task_sop_step 
        FOREIGN KEY (sop_step_id) 
        REFERENCES public.sop_step(sop_step_id);
    END IF;
END $$;

-- 6. Add a helpful comment for future developers
COMMENT ON COLUMN task.tasks.sop_step_id IS 'MANDATORY: Links every task to an SOP step for Total Governance compliance.';

COMMIT;
