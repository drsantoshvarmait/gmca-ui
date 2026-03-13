import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulfrylptbnrfewodzhck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZnJ5bHB0Ym5yZmV3b2R6aGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzIyMzUsImV4cCI6MjA4NTA0ODIzNX0._qhJJ2KREGeUSD4EX-dCtstCq8J88zJZPk14T9qrh60';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    console.log('--- Verifying Database Schema & Seed Data ---');

    try {
        // 1. Check vendors
        const { data: vendors, error: vError } = await supabase.schema('procurement').from('vendors').select('count', { count: 'exact', head: true });
        if (vError) console.error('❌ procurement.vendors missing or inaccessible:', vError.message);
        else console.log('✅ procurement.vendors table exists.');

        // 2. Check coa_templates
        const { data: coa, error: cError } = await supabase.schema('finance').from('coa_templates').select('*').limit(5);
        if (cError) console.error('❌ finance.coa_templates missing or inaccessible:', cError.message);
        else if (coa.length > 0) console.log(`✅ finance.coa_templates table seeded (found ${coa.length} samples).`);
        else console.log('⚠️ finance.coa_templates is empty.');

        // 3. Check hsn_sac_master
        const { data: hsn, error: hError } = await supabase.schema('procurement').from('hsn_sac_master').select('*').limit(5);
        if (hError) console.error('❌ procurement.hsn_sac_master missing or inaccessible:', hError.message);
        else if (hsn.length > 0) console.log(`✅ procurement.hsn_sac_master table seeded (found ${hsn.length} samples).`);
        else console.log('⚠️ procurement.hsn_sac_master is empty.');

        // 4. Check find a tenant to check inheritance
        const { data: tenants, error: tError } = await supabase.schema('core').from('tenants').select('tenant_id, tenant_name').limit(1);
        if (tError) console.error('❌ core.tenants access error:', tError.message);
        else if (tenants.length > 0) {
            const tid = tenants[0].tenant_id;
            console.log(`✅ Found tenant: ${tenants[0].tenant_name} (${tid})`);
        }

    } catch (err) {
        console.error('CRITICAL ERROR DURING VERIFICATION:', err.message);
    }
}

verify();
