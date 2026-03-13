-- ============================================
-- 20260311060000_procurement_and_coa_v1.sql
-- Chart of Accounts (CoA) & Procurement Module
-- Compliance: CAG (Government) & GFR/Income Tax (Private)
-- ============================================

-- 1. EXTEND FINANCE SCHEMA
CREATE SCHEMA IF NOT EXISTS finance;

-- Multi-context Chart of Accounts
CREATE TABLE IF NOT EXISTS finance.chart_of_accounts (
    account_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    
    -- Hierarchical CAG/AG Coding (For Government)
    major_head char(4),         -- e.g., '2210' (Medical & Public Health)
    sub_major_head char(2),     -- e.g., '05' (Medical Education)
    minor_head char(3),         -- e.g., '105' (Allopathy)
    sub_head char(2),           -- e.g., '01' (Organisation Unit - GMCA)
    detailed_head char(2),      -- e.g., '01' (Sub-Scheme)
    object_head char(2),        -- e.g., '21' (Supplies / Expenses)
    
    -- Fallback for Private/Flat CoA
    account_code text,          -- e.g., '6020-001' (Statutory Head)
    
    -- Virtual Full Code for search/index
    full_account_code text GENERATED ALWAYS AS (
        COALESCE(major_head || '-' || sub_major_head || '-' || minor_head || '-' || sub_head || '-' || detailed_head || '-' || object_head, account_code)
    ) STORED,
    
    account_name text NOT NULL,
    account_type text NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    tax_audit_tag text,         -- e.g., 'Section 37(1)', 'Section 30'
    
    parent_id uuid REFERENCES finance.chart_of_accounts(account_id),
    is_active boolean DEFAULT true,
    
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, full_account_code)
);

-- 2. CREATE PROCUREMENT SCHEMA
CREATE SCHEMA IF NOT EXISTS procurement;

-- Global Vendor Master
CREATE TABLE IF NOT EXISTS procurement.vendors (
    vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    pan char(10) UNIQUE,
    tan char(10),
    is_global boolean DEFAULT true,
    website text,
    created_at timestamptz DEFAULT now()
);

-- Vendor GSTIN Registry (Multi-state support)
CREATE TABLE IF NOT EXISTS procurement.vendor_gstin (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL REFERENCES procurement.vendors(vendor_id) ON DELETE CASCADE,
    gstin char(15) NOT NULL UNIQUE,
    state_code char(2) NOT NULL,
    address text,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Tenant-Vendor Relationship (Many-to-Many)
CREATE TABLE IF NOT EXISTS procurement.tenant_vendors (
    tenant_id uuid NOT NULL REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    vendor_id uuid NOT NULL REFERENCES procurement.vendors(vendor_id) ON DELETE CASCADE,
    
    internal_vendor_code text, -- e.g., "V-GMC-001"
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKLISTED')),
    payment_terms text,
    tds_section_exemptions jsonb DEFAULT '[]',
    
    PRIMARY KEY (tenant_id, vendor_id)
);

-- HSN / SAC Master Lookup
CREATE TABLE IF NOT EXISTS procurement.hsn_sac_master (
    hsn_sac_code text PRIMARY KEY,
    description text NOT NULL,
    gst_rate decimal(5,2) DEFAULT 18.00,
    is_service boolean DEFAULT false
);

-- Purchase Requisitions (Linked to SOP Workflow)
CREATE TABLE IF NOT EXISTS procurement.purchase_requisitions (
    pr_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    organisation_id uuid REFERENCES public.organisations(organisation_id),
    
    pr_number text NOT NULL, -- e.g., "PR-2026-0001"
    requested_by uuid NOT NULL REFERENCES core.app_users(user_id),
    requested_date date DEFAULT current_date,
    
    workflow_id uuid REFERENCES public.sop_workflow(workflow_id), -- Approval SOP
    status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO')),
    
    total_estimated_cost decimal(19,4) DEFAULT 0,
    justification text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, pr_number)
);

-- Requisition Line Items (Linked to CoA)
CREATE TABLE IF NOT EXISTS procurement.pr_items (
    pr_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id uuid NOT NULL REFERENCES procurement.purchase_requisitions(pr_id) ON DELETE CASCADE,
    
    item_variant_id uuid, -- Reference to inventory if exists
    item_description text NOT NULL,
    hsn_sac_code text REFERENCES procurement.hsn_sac_master(hsn_sac_code),
    account_id uuid REFERENCES finance.chart_of_accounts(account_id), -- LINK TO COA
    
    quantity decimal(15,2) NOT NULL,
    unit_of_measure text,
    estimated_unit_price decimal(19,4) NOT NULL,
    
    gst_rate decimal(5,2) DEFAULT 0,
    total_amount_with_tax decimal(19,4) GENERATED ALWAYS AS (quantity * estimated_unit_price * (1 + gst_rate/100)) STORED
);

-- Purchase Orders (Generated from PR)
CREATE TABLE IF NOT EXISTS procurement.purchase_orders (
    po_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    pr_id uuid REFERENCES procurement.purchase_requisitions(pr_id),
    vendor_id uuid NOT NULL REFERENCES procurement.vendors(vendor_id),
    vendor_gstin_id uuid REFERENCES procurement.vendor_gstin(id),
    
    po_number text NOT NULL,
    po_date date DEFAULT current_date,
    status text DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED', 'CANCELLED')),
    
    total_base_amount decimal(19,4) DEFAULT 0,
    total_tax_amount decimal(19,4) DEFAULT 0,
    total_tds_amount decimal(19,4) DEFAULT 0,
    total_po_amount decimal(19,4) DEFAULT 0,
    
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, po_number)
);

-- Procurement Audit Trail
CREATE TABLE IF NOT EXISTS procurement.audit_trail (
    audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES core.tenants(tenant_id),
    user_id uuid REFERENCES core.app_users(user_id),
    
    entity_type text NOT NULL, -- 'PR', 'PO', 'VENDOR'
    entity_id uuid NOT NULL,
    action text NOT NULL, -- 'CREATED', 'APPROVED', 'MODIFIED'
    
    old_payload jsonb,
    new_payload jsonb,
    
    ip_address text,
    timestamp timestamptz DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE finance.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.vendor_gstin ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.tenant_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.pr_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.audit_trail ENABLE ROW LEVEL SECURITY;

-- 4. TENANT ISOLATION POLICIES
CREATE POLICY tenant_isolation_coa ON finance.chart_of_accounts
FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_vendors ON procurement.tenant_vendors
FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_pr ON procurement.purchase_requisitions
FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_po ON procurement.purchase_orders
FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_audit ON procurement.audit_trail
FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Global Master Visibility (Readable by all, writable only by system/global role)
CREATE POLICY global_read_vendors ON procurement.vendors
FOR SELECT USING (true);

CREATE POLICY global_read_hsn ON procurement.hsn_sac_master
FOR SELECT USING (true);
