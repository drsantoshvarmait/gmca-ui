import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulfrylptbnrfewodzhck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZnJ5bHB0Ym5yZmV3b2R6aGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzIyMzUsImV4cCI6MjA4NTA0ODIzNX0._qhJJ2KREGeUSD4EX-dCtstCq8J88zJZPk14T9qrh60';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAuthHeads() {
    console.log('--- Verifying Authentic CAG/AG Heads (LMMHA) ---');

    try {
        // 1. Check templates for 2210-05 series
        const { data: templates, error: tErr } = await supabase
            .schema('finance')
            .from('coa_templates')
            .select('major_head, minor_head, account_name')
            .eq('major_head', '2210')
            .eq('sub_major_head', '05');

        if (tErr) throw tErr;
        console.log(`✅ Templates: Found ${templates.length} heads for Medical Education (2210-05).`);

        // 2. Check for specific Object Heads (21, 34, 52)
        const { data: objCheck } = await supabase
            .schema('finance')
            .from('coa_templates')
            .select('object_head, account_name')
            .in('object_head', ['21', '34', '52']);

        console.log('✅ Specific Object Heads detected:');
        objCheck.forEach(o => console.log(`   - [Obj ${o.object_head}] : ${o.account_name}`));

        // 3. Check HSN Master for Diagnostic Reagents (3822)
        const { data: hsnCheck } = await supabase
            .schema('procurement')
            .from('hsn_sac_master')
            .select('description')
            .eq('hsn_sac_code', '3822')
            .single();

        if (hsnCheck) console.log(`✅ HSN Master: Verified code 3822 for "${hsnCheck.description}".`);

    } catch (err) {
        console.log('⚠️ Verification Note: Backend tables might not be updated yet. Please run seed_authentic_coa.sql in Supabase.');
    }
}

verifyAuthHeads();
