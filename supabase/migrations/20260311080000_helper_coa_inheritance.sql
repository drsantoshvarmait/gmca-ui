-- ============================================
-- RPC: core.inherit_coa_from_template
-- Facilitates easy seeding of CoA based on Tenant Type
-- ============================================

CREATE OR REPLACE FUNCTION finance.inherit_coa_from_template(
    p_tenant_id uuid,
    p_sector_name text
) RETURNS integer AS $$
DECLARE
    v_count integer := 0;
BEGIN
    -- Check if tenant already has CoA entries to avoid duplication
    IF EXISTS (SELECT 1 FROM finance.chart_of_accounts WHERE tenant_id = p_tenant_id) THEN
        RETURN 0;
    END IF;

    -- Clone from Template
    INSERT INTO finance.chart_of_accounts (
        tenant_id,
        major_head,
        sub_major_head,
        minor_head,
        object_head,
        account_code,
        account_name,
        account_type,
        tax_audit_tag,
        is_active
    )
    SELECT 
        p_tenant_id,
        major_head,
        sub_major_head,
        minor_head,
        object_head,
        account_code,
        account_name,
        account_type,
        tax_audit_tag,
        true
    FROM finance.coa_templates
    WHERE sector_name = p_sector_name;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
