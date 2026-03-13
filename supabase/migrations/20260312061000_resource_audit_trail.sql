-- Resource Allocation Audit Trail
CREATE TABLE IF NOT EXISTS public.organisation_unit_resource_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID,
    org_sub_unit_id UUID REFERENCES public.organisation_unit_sub_units(id) ON DELETE CASCADE,
    resource_name TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_by_email TEXT,
    old_qty INTEGER,
    new_qty INTEGER,
    change_type TEXT DEFAULT 'UPDATE', -- 'INITIAL', 'UPDATE', 'DELETE'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger Function to log changes automatically
CREATE OR REPLACE FUNCTION public.fn_log_resource_allocation_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    -- Try to getting current user from supabase session
    current_user_id := auth.uid();
    
    -- Log the change
    INSERT INTO public.organisation_unit_resource_audit_logs (
        organisation_id,
        org_sub_unit_id,
        resource_name,
        changed_by,
        old_qty,
        new_qty,
        change_type
    ) VALUES (
        NEW.organisation_id,
        NEW.org_sub_unit_id,
        NEW.resource_name,
        current_user_id,
        CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.allocated_qty END,
        NEW.allocated_qty,
        TG_OP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Trigger
DROP TRIGGER IF EXISTS trg_log_resource_allocation ON public.organisation_unit_resource_actuals;
CREATE TRIGGER trg_log_resource_allocation
AFTER INSERT OR UPDATE ON public.organisation_unit_resource_actuals
FOR EACH ROW EXECUTE FUNCTION public.fn_log_resource_allocation_change();

-- Enable RLS
ALTER TABLE public.organisation_unit_resource_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view audit logs" ON public.organisation_unit_resource_audit_logs FOR SELECT TO authenticated USING (true);
