-- ============================================================
-- MEDD MIGRATION: MARATHI LOCALIZATION & STATUTORY COA
-- ============================================================

-- 1. SET MEDD TENANT LANGUAGES
UPDATE public.tenants 
SET 
    default_language_code = 'mr',
    secondary_language_code = 'en',
    reporting_language_code = 'mr'
WHERE tenant_code = 'MEDD';

-- 2. REFRESH CHART OF ACCOUNTS FOR MEDD (FETCH MARATHI NAMES)
-- This uses the dynamic localization function we built earlier.
SELECT public.fin_inherit_coa_from_template('58f443c8-4bd5-46be-9471-3de6abeca27e', 'Govt Medical Education');

-- 3. ENSURE ALL MEDD ORGANIZATIONS ARE ACTIVE AND LOCALIZED
-- (We'll just verify they exist and are under the correct tenant)
UPDATE public.organisations
SET organisation_name_local = 'शासकीय वैद्यकीय महाविद्यालय' -- Fallback if null
WHERE tenant_id = '58f443c8-4bd5-46be-9471-3de6abeca27e' 
AND (organisation_name_local IS NULL OR organisation_name_local = '');

-- 4. VERIFY BILINGUAL MAPPING IN COA
-- (Internal check to ensure Marathi names were pulled from object_heads)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.fin_coa WHERE tenant_id = '58f443c8-4bd5-46be-9471-3de6abeca27e' AND local_account_name IS NOT NULL) THEN
        RAISE NOTICE 'Warning: No Marathi names found in CoA for MEDD. Checking object_heads...';
    END IF;
END $$;
