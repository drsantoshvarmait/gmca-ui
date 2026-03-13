-- ============================================================
-- ENHANCED COA & PROCUREMENT SETUP (WITH MARATHI SUPPORT)
-- Linking to official public.object_heads & public.object_heads_subobjective
-- ============================================================

-- I. ENHANCE COA TABLE FOR BILINGUAL SUPPORT
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fin_coa' AND column_name = 'account_name_mr') THEN
        ALTER TABLE public.fin_coa ADD COLUMN account_name_mr text;
    END IF;
END $$;

-- II. UPDATE INHERITANCE FUNCTION TO FETCH FROM MASTER TABLES
CREATE OR REPLACE FUNCTION public.fin_inherit_coa_from_template(p_tenant_id uuid, p_sector_name text) RETURNS integer AS $$
DECLARE v_count integer := 0;
BEGIN
    -- Delete existing for this sector to prevent duplicates during refresh
    DELETE FROM public.fin_coa WHERE tenant_id = p_tenant_id;

    -- Insert joining with official object_heads for Marathi names
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
        COALESCE(oh.object_head_name_en, t.account_name), -- Preference to Master table
        oh.object_head_name_mr,                          -- Official Marathi Name
        t.account_type, 
        t.tax_audit_tag, 
        true
    FROM public.fin_coa_templates t
    LEFT JOIN public.object_heads oh ON t.object_head = oh.object_head_code
    WHERE t.sector_name = p_sector_name;

    GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- III. RE-SEED COA FOR ALL TENANTS WITH MARATHI NAMES
DO $$
DECLARE t_id uuid;
BEGIN
    FOR t_id IN (SELECT tenant_id FROM public.tenants) LOOP
        PERFORM public.fin_inherit_coa_from_template(t_id, 'Govt Medical Education');
    END LOOP;
END $$;
