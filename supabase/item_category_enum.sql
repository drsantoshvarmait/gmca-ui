-- ============================================================
-- SQL: IMPLEMENT ITEM CATEGORY ENUM
-- ============================================================

-- 1. Create the ENUM type
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_category_enum') THEN
        CREATE TYPE public.item_category_enum AS ENUM (
            'Furniture', 
            'Equipment (Medical)', 
            'Equipment (General)', 
            'Stationery', 
            'Drugs/Medicines', 
            'Surgical Consumables', 
            'Lab Reagents', 
            'Printing', 
            'IT/Computer', 
            'Maintenance/Store',
            'Others'
        );
    END IF;
END $$;

-- 2. Add the column to items table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'item_category') THEN
        ALTER TABLE public.items ADD COLUMN item_category public.item_category_enum DEFAULT 'Others';
    END IF;
END $$;

-- 3. Update existing data based on category_id descriptions (heuristic)
UPDATE public.items 
SET item_category = 'Drugs/Medicines' 
WHERE category_id IN (SELECT category_id FROM public.item_categories WHERE category_name ILIKE '%Drug%');

UPDATE public.items 
SET item_category = 'Equipment (Medical)' 
WHERE category_id IN (SELECT category_id FROM public.item_categories WHERE category_name ILIKE '%Equip%');

UPDATE public.items 
SET item_category = 'Surgical Consumables' 
WHERE category_id IN (SELECT category_id FROM public.item_categories WHERE category_name ILIKE '%Surg%');
