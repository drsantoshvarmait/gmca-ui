-- Add sequence to organisation_type_units for reordering
ALTER TABLE public.organisation_type_units ADD COLUMN IF NOT EXISTS sequence integer DEFAULT 0;

-- Ensure we have a unique constraint that allows reordering (though typically we just update all)
-- If we want a pool of names, we can just extract unique names from this table or create a master list.
-- Let's create a master list for better dropdown performance and deduplication.
CREATE TABLE IF NOT EXISTS public.master_organisation_units (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- Seed master list from current data
INSERT INTO public.master_organisation_units (unit_name)
SELECT DISTINCT unit_name FROM public.organisation_type_units
ON CONFLICT DO NOTHING;
