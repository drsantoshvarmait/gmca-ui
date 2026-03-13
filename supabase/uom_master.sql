-- ============================================================
-- SQL: UOM MASTER AND MASTER DATA UPDATES
-- ============================================================

-- 1. Create UOM Master table
CREATE TABLE IF NOT EXISTS public.proc_uom_master (
    uom_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(tenant_id),
    uom_name TEXT NOT NULL,
    uom_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Populate standard UOMs
INSERT INTO public.proc_uom_master (uom_name, uom_code) VALUES 
('Number', 'Nos'),
('Strip', 'Strip'),
('Box', 'Box'),
('Pack', 'Pack'),
('Kilogram', 'Kg'),
('Litre', 'Litre'),
('Gram', 'Gm'),
('Meter', 'Mtr'),
('Bottle', 'Btl')
ON CONFLICT DO NOTHING;

-- 3. Ensure Item Categories have some standard values if empty
-- (already populated in previous steps for MEDD tenant, but good to have)
