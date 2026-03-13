import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulfrylptbnrfewodzhck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZnJ5bHB0Ym5yZmV3b2R6aGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzIyMzUsImV4cCI6MjA4NTA0ODIzNX0._qhJJ2KREGeUSD4EX-dCtstCq8J88zJZPk14T9qrh60';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function peek() {
    const { data } = await supabase.schema('core').from('tenants').select('tenant_id, tenant_name').limit(1);
    console.log(JSON.stringify(data));
}
peek();
