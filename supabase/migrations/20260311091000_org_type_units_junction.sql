-- Org Type Units junction
CREATE TABLE IF NOT EXISTS public.organisation_type_units (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organisation_type_id uuid REFERENCES public.organisation_types(organisation_type_id) ON DELETE CASCADE,
    unit_name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(organisation_type_id, unit_name)
);

-- Seed some for Medical College
DO $$
DECLARE
    v_mc_type_id uuid;
BEGIN
    SELECT organisation_type_id INTO v_mc_type_id FROM public.organisation_types WHERE organisation_type_name = 'Medical College' LIMIT 1;
    IF v_mc_type_id IS NOT NULL THEN
        INSERT INTO public.organisation_type_units (organisation_type_id, unit_name)
        VALUES 
            (v_mc_type_id, 'Anatomy'), 
            (v_mc_type_id, 'Physiology'), 
            (v_mc_type_id, 'Biochemistry'), 
            (v_mc_type_id, 'Pathology'), 
            (v_mc_type_id, 'Microbiology'), 
            (v_mc_type_id, 'Pharmacology'), 
            (v_mc_type_id, 'Forensic Medicine'), 
            (v_mc_type_id, 'Community Medicine')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
