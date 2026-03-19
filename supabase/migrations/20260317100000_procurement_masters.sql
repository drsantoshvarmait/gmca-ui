-- ============================================================
-- 20260317100000_procurement_masters.sql
-- Extension of Master Data to Procurement (Items & Vendors)
-- ============================================================

-- 1. Create the Global Item Master Pool
CREATE TABLE IF NOT EXISTS public.item_masters (
    item_master_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name text NOT NULL,
    item_code text UNIQUE,
    category text, -- e.g., 'Drugs', 'Equipment'
    default_uom text,
    is_statutory boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 2. Seed Global Items
INSERT INTO public.item_masters (item_name, item_code, category, default_uom)
VALUES 
    ('Paracetamol 500mg', 'PARA-500', 'Drugs/Medicines', 'Strip'),
    ('Amoxicillin 250mg', 'AMOX-250', 'Drugs/Medicines', 'Strip'),
    ('Disposable Syringe 5ml', 'SYR-5ML', 'Surgical Consumables', 'Nos'),
    ('Latex Gloves (Medium)', 'GLOVE-M', 'Surgical Consumables', 'Pair'),
    ('ICU Ventilator XL', 'VENT-ICU-XL', 'Equipment (Medical)', 'Nos'),
    ('Digital X-Ray Machine', 'XRAY-DIGI', 'Equipment (Medical)', 'Nos'),
    ('Oxygen Concentrator', 'OXY-CONC', 'Equipment (Medical)', 'Nos'),
    ('Printer Paper A4', 'PAPER-A4', 'Stationery', 'Ream'),
    ('Office Desk (L-Shape)', 'FURN-DESK-L', 'Furniture', 'Nos')
ON CONFLICT (item_code) DO NOTHING;

-- 3. Ensure proc_vendors is ready for global use
-- (Table already exists in public in setup_procurement.sql)

-- 4. Enable RLS for item_masters
ALTER TABLE public.item_masters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS global_read_item_masters ON public.item_masters;
CREATE POLICY global_read_item_masters ON public.item_masters
FOR SELECT USING (true);

-- 5. Seed some initial Vendors if none exist
INSERT INTO public.proc_vendors (name, pan, website)
VALUES 
    ('Global Pharma Co.', 'ABCDE1234F', 'https://globalpharma.com'),
    ('Modern Meditech Solutions', 'BCDEF2345G', 'https://modernmeditech.com'),
    ('Supreme Furniture Ltd.', 'CDEFG3456H', 'https://supremefurniture.com'),
    ('Office Depot Plus', 'DEFGH4567I', 'https://officedepot.com')
ON CONFLICT (pan) DO NOTHING;
