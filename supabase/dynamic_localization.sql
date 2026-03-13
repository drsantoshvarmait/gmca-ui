-- ============================================================
-- GLOBAL DYNAMIC LOCALIZATION & SUB-OBJECTIVE SYNC
-- ============================================================

-- 1. ADD SUBOBJECTIVE LINKAGE TO PR ITEMS
ALTER TABLE public.proc_pr_items ADD COLUMN IF NOT EXISTS subobjective_id uuid REFERENCES public.object_heads_subobjective(subobjective_id);

-- 2. ENHANCE COA TO STORE DYNAMIC LOCAL NAMES
-- Instead of hardcoding 'mr', we'll use 'local_account_name' which adapts to tenant settings.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fin_coa' AND column_name = 'local_account_name') THEN
        ALTER TABLE public.fin_coa ADD COLUMN local_account_name text;
    END IF;
END $$;

-- 3. UPDATED INHERITANCE FUNCTION (DYNAMIC LANGUAGE & SUB-OBJECTIVE)
CREATE OR REPLACE FUNCTION public.fin_inherit_coa_from_template(p_tenant_id uuid, p_sector_name text) RETURNS integer AS $$
DECLARE 
    v_count integer := 0;
    v_sec_lang text;
BEGIN
    -- Get the tenant's secondary language preference
    SELECT secondary_language_code INTO v_sec_lang FROM public.tenants WHERE tenant_id = p_tenant_id;

    -- Refresh for this tenant
    DELETE FROM public.fin_coa WHERE tenant_id = p_tenant_id;

    -- Logical mapping: Link to Object Heads and fetch Localized Name dynamically
    INSERT INTO public.fin_coa (
        tenant_id, major_head, sub_major_head, minor_head, object_head, 
        account_code, account_name, local_account_name, account_type, tax_audit_tag, is_active
    )
    SELECT 
        p_tenant_id, 
        t.major_head, 
        t.sub_major_head, 
        t.minor_head, 
        t.object_head, 
        t.account_code, 
        COALESCE(oh.object_head_name_en, t.account_name),
        CASE 
            WHEN v_sec_lang = 'mr' THEN oh.object_head_name_mr
            -- Add other language support here easily (e.g., gu, hi)
            ELSE NULL 
        END,
        t.account_type, 
        t.tax_audit_tag, 
        true
    FROM public.fin_coa_templates t
    LEFT JOIN public.object_heads oh ON t.object_head = oh.object_head_code
    WHERE t.sector_name = p_sector_name;

    GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. APPLY TO ALL TENANTS
DO $$
DECLARE t_id uuid;
BEGIN
    FOR t_id IN (SELECT tenant_id FROM public.tenants) LOOP
        PERFORM public.fin_inherit_coa_from_template(t_id, 'Govt Medical Education');
    END LOOP;
END $$;
