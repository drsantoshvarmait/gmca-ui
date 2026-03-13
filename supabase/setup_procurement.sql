-- ============================================================
-- CONSOLIDATED PROCUREMENT & COA SETUP SCRIPT (PUBLIC SCHEMA FIX)
-- ============================================================
-- Using 'public' schema to avoid Supabase "Invalid schema" errors.
-- Tables are prefixed with 'fin_' or 'proc_' for organization.
-- ============================================================

-- II. CHART OF ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.fin_coa (
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
        COALESCE(major_head || '-' || sub_major_head || '-' || minor_head || '-' || sub_head || '-' || detailed_head || '-' || object_head, account_code)
    ) STORED,
    account_name text NOT NULL,
    account_type text NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    tax_audit_tag text,
    parent_id uuid REFERENCES public.fin_coa(account_id),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, full_account_code)
);

-- III. PROCUREMENT TABLES
CREATE TABLE IF NOT EXISTS public.proc_vendors (
    vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    pan char(10) UNIQUE,
    website text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proc_tenant_vendors (
    tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    vendor_id uuid NOT NULL REFERENCES public.proc_vendors(vendor_id) ON DELETE CASCADE,
    internal_vendor_code text,
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKLISTED')),
    PRIMARY KEY (tenant_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS public.proc_hsn_sac_master (
    hsn_sac_code text PRIMARY KEY,
    description text NOT NULL,
    gst_rate decimal(5,2) DEFAULT 18.00
);

CREATE TABLE IF NOT EXISTS public.proc_purchase_requisitions (
    pr_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    pr_number text NOT NULL,
    requested_by uuid NOT NULL REFERENCES public.profiles(id),
    requested_date date DEFAULT current_date,
    workflow_id uuid REFERENCES public.sop_workflow(workflow_id),
    status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO')),
    total_estimated_cost decimal(19,4) DEFAULT 0,
    justification text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, pr_number)
);

CREATE TABLE IF NOT EXISTS public.proc_pr_items (
    pr_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id uuid NOT NULL REFERENCES public.proc_purchase_requisitions(pr_id) ON DELETE CASCADE,
    item_description text NOT NULL,
    hsn_sac_code text REFERENCES public.proc_hsn_sac_master(hsn_sac_code),
    account_id uuid REFERENCES public.fin_coa(account_id),
    quantity decimal(15,2) NOT NULL,
    estimated_unit_price decimal(19,4) NOT NULL,
    gst_rate decimal(5,2) DEFAULT 0,
    total_amount_with_tax decimal(19,4) GENERATED ALWAYS AS (quantity * estimated_unit_price * (1 + gst_rate/100)) STORED
);

-- IV. PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS public.proc_purchase_orders (
    po_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    pr_id uuid REFERENCES public.proc_purchase_requisitions(pr_id),
    vendor_id uuid NOT NULL REFERENCES public.proc_vendors(vendor_id),
    po_number text NOT NULL,
    po_date date DEFAULT current_date,
    status text DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED', 'CANCELLED')),
    total_po_amount decimal(19,4) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, po_number)
);

CREATE TABLE IF NOT EXISTS public.proc_po_items (
    po_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id uuid NOT NULL REFERENCES public.proc_purchase_orders(po_id) ON DELETE CASCADE,
    item_description text NOT NULL,
    quantity decimal(15,2) NOT NULL,
    unit_price decimal(19,4) NOT NULL,
    gst_rate decimal(5,2) DEFAULT 0
);

-- V. GOODS RECEIPT
CREATE TABLE IF NOT EXISTS public.proc_goods_receipts (
    grn_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id uuid NOT NULL REFERENCES public.proc_purchase_orders(po_id) ON DELETE CASCADE,
    received_date date DEFAULT current_date,
    status text DEFAULT 'COMPLETED',
    created_at timestamptz DEFAULT now()
);

-- IV. SEEDING TEMPLATES
CREATE TABLE IF NOT EXISTS public.fin_coa_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_name text NOT NULL,
    major_head char(4), sub_major_head char(2), minor_head char(3), object_head char(2), account_code text,
    account_name text NOT NULL, account_type text NOT NULL, tax_audit_tag text,
    created_at timestamptz DEFAULT now()
);

-- Add standard HSN codes
INSERT INTO public.proc_hsn_sac_master (hsn_sac_code, description, gst_rate)
VALUES 
('3822', 'Laboratory Reagents', 18.00),
('3004', 'Medicaments', 12.00),
('9018', 'Medical Instruments', 12.00)
ON CONFLICT DO NOTHING;

-- V. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.fin_inherit_coa_from_template(p_tenant_id uuid, p_sector_name text) RETURNS integer AS $$
DECLARE v_count integer := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM public.fin_coa WHERE tenant_id = p_tenant_id) THEN RETURN 0; END IF;
    INSERT INTO public.fin_coa (tenant_id, major_head, sub_major_head, minor_head, object_head, account_code, account_name, account_type, tax_audit_tag, is_active)
    SELECT p_tenant_id, major_head, sub_major_head, minor_head, object_head, account_code, account_name, account_type, tax_audit_tag, true
    FROM public.fin_coa_templates WHERE sector_name = p_sector_name;
    GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
