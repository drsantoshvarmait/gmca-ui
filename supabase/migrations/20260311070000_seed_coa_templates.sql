-- ============================================
-- 20260311070000_seed_coa_templates.sql
-- Seed Standard CAG Heads for Medical Education
-- and Income Tax Heads for Private Healthcare
-- ============================================

-- Reference table for Sector-based seeding logic
CREATE TABLE IF NOT EXISTS finance.coa_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_name text NOT NULL, -- e.g., 'Government Medical Education', 'Private Healthcare'
    
    major_head char(4),
    sub_major_head char(2),
    minor_head char(3),
    object_head char(2),
    account_code text,
    
    account_name text NOT NULL,
    account_type text NOT NULL,
    tax_audit_tag text,
    is_teaching_head boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Seed CAG Standard Heads (Government Context)
INSERT INTO finance.coa_templates (sector_name, major_head, sub_major_head, minor_head, object_head, account_name, account_type, tax_audit_tag)
VALUES 
('Govt Medical Education', '2210', '05', '105', '01', 'Salaries & Wages', 'EXPENSE', 'AG_RULE_01'),
('Govt Medical Education', '2210', '05', '105', '13', 'Office Expenses', 'EXPENSE', 'AG_RULE_13'),
('Govt Medical Education', '2210', '05', '105', '21', 'Supplies & Materials (Lab Reagents/Drugs)', 'EXPENSE', 'AG_RULE_21'),
('Govt Medical Education', '2210', '05', '105', '34', 'Scholarships & Stipends', 'EXPENSE', 'AG_RULE_34'),
('Govt Medical Education', '4210', '03', '105', '52', 'Machinery & Equipment Capital Outlay', 'ASSET', 'AG_CAPITAL_52'),
('Govt Medical Education', '4210', '03', '105', '53', 'Major Works (Buildings)', 'ASSET', 'AG_CAPITAL_53');

-- Seed Income Tax / Statutory Heads (Private Context)
INSERT INTO finance.coa_templates (sector_name, account_code, account_name, account_type, tax_audit_tag)
VALUES 
('Private Healthcare', 'EXP-601', 'Medical Staff Salaries', 'EXPENSE', 'Sec 37(1)'),
('Private Healthcare', 'EXP-602', 'Visiting Consultant Fees', 'EXPENSE', 'Sec 37(1) - TDS 194J'),
('Private Healthcare', 'EXP-701', 'Medical Consumables & Reagents', 'EXPENSE', 'Sec 37(1)'),
('Private Healthcare', 'EXP-801', 'Equipment Maintenance (AMC)', 'EXPENSE', 'Sec 31'),
('Private Healthcare', 'EXP-901', 'Hospital Building Rent', 'EXPENSE', 'Sec 30'),
('Private Healthcare', 'ASS-101', 'Surgical Equipment (Medical Lab)', 'ASSET', 'Block: Machinery - 15%');

-- Seed standard HSN codes for Medical Supplies
INSERT INTO procurement.hsn_sac_master (hsn_sac_code, description, gst_rate)
VALUES 
('3004', 'Medicaments (Drugs for therapeutic use)', 12.00),
('3822', 'Laboratory Reagents for Diagnostic Tests', 18.00),
('9018', 'Instruments for Medical/Surgical Science', 12.00),
('9022', 'X-Ray / MRI / CT Scan Apparatus', 12.00),
('4820', 'Stationery / Register Books', 18.00);
