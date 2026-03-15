-- Add Role-Based Assignment support to SOP Steps
BEGIN;

-- 1. Add designation_id to sop_step
ALTER TABLE public.sop_step ADD COLUMN IF NOT EXISTS designation_id UUID;

-- 2. Add foreign key to designations table (assuming it is in public)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sop_step_designation') THEN
        ALTER TABLE public.sop_step 
        ADD CONSTRAINT fk_sop_step_designation 
        FOREIGN KEY (designation_id) 
        REFERENCES public.designations(designation_id);
    END IF;
END $$;

-- 3. Add position columns for the Visual Architect (React Flow support)
ALTER TABLE public.sop_step ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 0;
ALTER TABLE public.sop_step ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 0;

COMMENT ON COLUMN public.sop_step.designation_id IS 'The role responsible for completing this specific SOP step.';
COMMENT ON COLUMN public.sop_step.position_x IS 'X-coordinate for the visual workflow builder.';
COMMENT ON COLUMN public.sop_step.position_y IS 'Y-coordinate for the visual workflow builder.';

COMMIT;
