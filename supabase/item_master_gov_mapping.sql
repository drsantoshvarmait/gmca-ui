-- ============================================================
-- ITEM MASTER ENHANCEMENT: GOVT MAPPING
-- ============================================================

-- 1. ADD TENANT TYPE TO TENANTS (FOR SMART MAPPING LOGIC)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'tenant_type') THEN
        ALTER TABLE public.tenants ADD COLUMN tenant_type text;
    END IF;
END $$;

-- 2. SET MEDD AS STATE GOVERNMENT
UPDATE public.tenants SET tenant_type = 'State Government' WHERE tenant_code = 'MEDD';

-- 3. ADD SUBOBJECTIVE LINKAGE TO ITEM MASTER
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'subobjective_id') THEN
        ALTER TABLE public.items ADD COLUMN subobjective_id uuid REFERENCES public.object_heads_subobjective(subobjective_id);
    END IF;
END $$;

-- 4. MAP SAMPLE ITEMS TO SUB-OBJECTIVES (FOR MEDD)
-- item 'Para Tablet' -> 'Medicines'
UPDATE public.items 
SET subobjective_id = '8327d56f-c701-4f68-b7bc-64dbe8619209' 
WHERE item_code = 'PARA-BASE' AND tenant_id = '58f443c8-4bd5-46be-9471-3de6abeca27e';

-- item 'Amoxicillin' -> 'Medicines'
UPDATE public.items 
SET subobjective_id = '8327d56f-c701-4f68-b7bc-64dbe8619209' 
WHERE item_code = 'AMOX' AND tenant_id = '58f443c8-4bd5-46be-9471-3de6abeca27e';

-- item 'IV Set' -> 'Surgical Supplies'
UPDATE public.items 
SET subobjective_id = '20c41b46-a41d-4cb5-a433-22e8728a9dc8' 
WHERE item_code = 'IVSET' AND tenant_id = '58f443c8-4bd5-46be-9471-3de6abeca27e';
