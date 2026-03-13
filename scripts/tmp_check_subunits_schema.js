
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulfrylptbnrfewodzhck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZnJ5bHB0Ym5yZmV3b2R6aGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzIyMzUsImV4cCI6MjA4NTA0ODIzNX0._qhJJ2KREGeUSD4EX-dCtstCq8J88zJZPk14T9qrh60';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'organisation_unit_sub_units' });
    if (error) {
        // Fallback if RPC doesn't exist
        const { data: sample, error: err2 } = await supabase.from('organisation_unit_sub_units').select('*').limit(1);
        console.log('Sample Data Key:', Object.keys(sample?.[0] || {}));
    } else {
        console.log('Columns:', data);
    }
}

checkSchema();
