-- ============================================================
-- FIXING GENERATED ACCOUNT CODE & SCHEMA SYNC
-- ============================================================

-- 1. Drop and Re-create fin_coa with better generated code logic
DROP TABLE IF EXISTS public.fin_coa CASCADE;

CREATE TABLE public.fin_coa (
    account_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    major_head char(4),
    sub_major_head char(2),
    minor_head char(3),
    sub_head char(2),
    detailed_head char(2),
    object_head char(2),
    account_code text,
    full_account_code text GENERATED ALWAYS AS (
        CASE 
            WHEN major_head IS NOT NULL AND object_head IS NOT NULL THEN
                major_head || '-' || 
                COALESCE(sub_major_head, '00') || '-' || 
                COALESCE(minor_head, '000') || '-' || 
                COALESCE(object_head, '00')
            ELSE account_code
        END
    ) STORED,
    account_name text NOT NULL,
    account_name_mr text,
    account_type text NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    tax_audit_tag text,
    parent_id uuid REFERENCES public.fin_coa(account_id),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, full_account_code)
);

-- 2. Update Inheritance Function for robustness
CREATE OR REPLACE FUNCTION public.fin_inherit_coa_from_template(p_tenant_id uuid, p_sector_name text) RETURNS integer AS $$
DECLARE v_count integer := 0;
BEGIN
    INSERT INTO public.fin_coa (
        tenant_id, major_head, sub_major_head, minor_head, object_head, 
        account_code, account_name, account_name_mr, account_type, tax_audit_tag, is_active
    )
    SELECT 
        p_tenant_id, 
        t.major_head, 
        t.sub_major_head, 
        t.minor_head, 
        t.object_head, 
        t.account_code, 
        COALESCE(oh.object_head_name_en, t.account_name),
        oh.object_head_name_mr,
        t.account_type, 
        t.tax_audit_tag, 
        true
    FROM public.fin_coa_templates t
    LEFT JOIN public.object_heads oh ON t.object_head = oh.object_head_code
    WHERE t.sector_name = p_sector_name;
    GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Run Sync
DO $$
DECLARE t_id uuid;
BEGIN
    FOR t_id IN (SELECT tenant_id FROM public.tenants) LOOP
        PERFORM public.fin_inherit_coa_from_template(t_id, 'Govt Medical Education');
    END LOOP;
END $$;
