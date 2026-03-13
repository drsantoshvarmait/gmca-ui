-- Comprehensive Merge Organisation Types (FIXED SYNTAX)
-- Reallocate all metadata, templates, and child organisations to a target and delete source.
CREATE OR REPLACE FUNCTION merge_organisation_types(source_id UUID, target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Move Organizations themselves
    UPDATE public.organisations 
    SET organisation_type_id = target_id 
    WHERE organisation_type_id = source_id;
    
    -- 2. Move Department Templates
    -- Conflict handling: If the target already has the same department (by code), re-map the org departments
    -- to the target's version then delete the duplicate template.
    FOR r IN (SELECT department_template_id, department_code FROM public.department_templates WHERE organisation_type_id = source_id) LOOP
        DECLARE
            v_target_dept_template_id UUID;
        BEGIN
            SELECT department_template_id INTO v_target_dept_template_id 
            FROM public.department_templates 
            WHERE organisation_type_id = target_id 
            AND department_code = r.department_code;

            IF v_target_dept_template_id IS NOT NULL THEN
                -- Re-map existing organisation departments from source template to target template
                UPDATE public.organisation_departments 
                SET department_template_id = v_target_dept_template_id
                WHERE department_template_id = r.department_template_id;

                -- Delete the redundant template for the source org type
                DELETE FROM public.department_templates WHERE department_template_id = r.department_template_id;
            ELSE
                -- Simply move the template to the target org type
                UPDATE public.department_templates SET organisation_type_id = target_id WHERE department_template_id = r.department_template_id;
            END IF;
        END;
    END LOOP;

    -- 3. Move Designation Mappings (Permissions)
    INSERT INTO public.org_type_designations (organisation_type_id, designation_id)
    SELECT target_id, designation_id FROM public.org_type_designations WHERE organisation_type_id = source_id
    ON CONFLICT (organisation_type_id, designation_id) DO NOTHING;
    
    DELETE FROM public.org_type_designations WHERE organisation_type_id = source_id;

    -- 4. Delete the source organisation_type
    DELETE FROM public.organisation_types WHERE organisation_type_id = source_id;
END;
$$;
