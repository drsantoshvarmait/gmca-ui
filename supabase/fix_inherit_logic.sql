-- ============================================================
-- IMPROVED DYNAMIC LOCALIZATION (Supports Primary or Secondary Marathi)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fin_inherit_coa_from_template(p_tenant_id uuid, p_sector_name text) RETURNS integer AS $$
DECLARE 
    v_count integer := 0;
    v_def_lang text;
    v_sec_lang text;
    v_is_marathi boolean;
BEGIN
    -- Get tenant language preferences
    SELECT default_language_code, secondary_language_code 
    INTO v_def_lang, v_sec_lang 
    FROM public.tenants 
    WHERE tenant_id = p_tenant_id;

    v_is_marathi := (v_def_lang = 'mr' OR v_sec_lang = 'mr');

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
            WHEN v_is_marathi THEN oh.object_head_name_mr
            ELSE NULL 
        END,
        t.account_type, 
        t.tax_audit_tag, 
        true
    FROM public.fin_coa_templates t
    LEFT JOIN public.object_heads oh ON TRIM(t.object_head) = TRIM(oh.object_head_code)
    WHERE t.sector_name = p_sector_name;

    GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
