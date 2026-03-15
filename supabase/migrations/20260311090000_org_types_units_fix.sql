-- Organisation Types & Units Schema
CREATE TABLE IF NOT EXISTS public.organisation_types (
    organisation_type_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organisation_type text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organisation_units (
    unit_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_name text NOT NULL,
    organisation_type_id uuid REFERENCES public.organisation_types(organisation_type_id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Seed with common medical types
INSERT INTO public.organisation_types (organisation_type) 
VALUES ('Medical College'), ('Hospital'), ('District Office'), ('PHC')
ON CONFLICT DO NOTHING;

-- Seed some units for Medical College (as an example)
DO $$
DECLARE
    v_mc_id uuid;
BEGIN
    SELECT organisation_type_id INTO v_mc_id FROM public.organisation_types WHERE organisation_type = 'Medical College' LIMIT 1;
    IF v_mc_id IS NOT NULL THEN
        INSERT INTO public.organisation_units (unit_name, organisation_type_id)
        VALUES 
            ('Anatomy Dept', v_mc_id), 
            ('Physiology Dept', v_mc_id), 
            ('Biochemistry Dept', v_mc_id), 
            ('Library', v_mc_id), 
            ('Hostel (Male)', v_mc_id), 
            ('Hostel (Female)', v_mc_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
