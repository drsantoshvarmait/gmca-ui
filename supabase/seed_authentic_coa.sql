-- ============================================================
-- ENHANCED COA SEEDING (AUTHENTIC CAG/AG HEADS) - PUBLIC SCHEMAS
-- Based on LMMHA (List of Major and Minor Heads)
-- Major Head 2210 (Medical & Public Health)
-- Sub-Major 05 (Medical Education, Training & Research)
-- ============================================================

-- I. REFRESH TEMPLATES WITH AUTHENTIC DATA
DELETE FROM public.fin_coa_templates WHERE sector_name = 'Govt Medical Education';

INSERT INTO public.fin_coa_templates (sector_name, major_head, sub_major_head, minor_head, object_head, account_name, account_type, tax_audit_tag)
VALUES 
-- [2210-05-105-01] Allopathy - Medical Colleges
('Govt Medical Education', '2210', '05', '105', '01', 'Salaries (Teaching Staff)', 'EXPENSE', 'AG_LMMHA_OBJ_01'),
('Govt Medical Education', '2210', '05', '105', '02', 'Wages (Non-Teaching/Contractual)', 'EXPENSE', 'AG_LMMHA_OBJ_02'),
('Govt Medical Education', '2210', '05', '105', '03', 'Dearness Allowance (DA)', 'EXPENSE', 'AG_LMMHA_OBJ_03'),
('Govt Medical Education', '2210', '05', '105', '06', 'Medical Reimbursement', 'EXPENSE', 'AG_LMMHA_OBJ_06'),
('Govt Medical Education', '2210', '05', '105', '11', 'Domestic Travel Expenses', 'EXPENSE', 'AG_LMMHA_OBJ_11'),
('Govt Medical Education', '2210', '05', '105', '13', 'Office Expenses (Administrative)', 'EXPENSE', 'AG_LMMHA_OBJ_13'),
('Govt Medical Education', '2210', '05', '105', '14', 'Rent, Rates and Taxes', 'EXPENSE', 'AG_LMMHA_OBJ_14'),
('Govt Medical Education', '2210', '05', '105', '21', 'Supplies & Materials (Lab Reagents/Chemicals)', 'EXPENSE', 'AG_LMMHA_OBJ_21'),
('Govt Medical Education', '2210', '05', '105', '24', 'POL (Petrol, Oil, Lubricants)', 'EXPENSE', 'AG_LMMHA_OBJ_24'),
('Govt Medical Education', '2210', '05', '105', '34', 'Scholarships and Stipends (MD/MBBS Students)', 'EXPENSE', 'AG_LMMHA_OBJ_34'),
('Govt Medical Education', '2210', '05', '105', '50', 'Other Charges (Library/Research)', 'EXPENSE', 'AG_LMMHA_OBJ_50');

-- [4210-03-105] Capital Outlay on Medical Education
INSERT INTO public.fin_coa_templates (sector_name, major_head, sub_major_head, minor_head, object_head, account_name, account_type, tax_audit_tag)
VALUES 
('Govt Medical Education', '4210', '03', '105', '51', 'Motor Vehicles (Ambulance/Staff Car)', 'ASSET', 'AG_LMMHA_OBJ_51'),
('Govt Medical Education', '4210', '03', '105', '52', 'Machinery and Equipment (MRI/CT Scan/Labs)', 'ASSET', 'AG_LMMHA_OBJ_52'),
('Govt Medical Education', '4210', '03', '105', '53', 'Major Works (College/Hostel Construction)', 'ASSET', 'AG_LMMHA_OBJ_53');

-- II. UPDATE HSN MASTER WITH MEDICAL INDUSTRY STANDARDS
DELETE FROM public.proc_hsn_sac_master WHERE hsn_sac_code IN ('3004', '3822', '9018', '9022', '4820');

INSERT INTO public.proc_hsn_sac_master (hsn_sac_code, description, gst_rate)
VALUES 
('3004', 'Medicaments (Drugs for retail sale)', 12.00),
('3822', 'Diagnostic/Lab Reagents (Chemical reagents)', 18.00),
('9018', 'Medical/Surgical Instruments (Forceps, Scalpels)', 12.00),
('9022', 'X-Ray, CT Scan, MRI Apparatus', 12.00),
('4820', 'Registers, Account Books & Stationery', 18.00),
('9983', 'Professional Technical Services (MC/AMC)', 18.00)
ON CONFLICT (hsn_sac_code) DO NOTHING;

-- III. PROPAGATE NEW HEADS TO ALL TENANTS
DO $$
DECLARE t_id uuid;
BEGIN
    FOR t_id IN (SELECT tenant_id FROM public.tenants) LOOP
        -- Delete existing to refresh with authentic LMMHA heads
        DELETE FROM public.fin_coa WHERE tenant_id = t_id;
        
        -- Re-inherit
        PERFORM public.fin_inherit_coa_from_template(t_id, 'Govt Medical Education');
    END LOOP;
END $$;
