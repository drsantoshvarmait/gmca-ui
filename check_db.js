
import { createClient } from '@supabase/supabase-js';

const url = "https://aaritujhokbxezuxcqnm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcml0dWpob2tieGV6dXhjcW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTg0MTUsImV4cCI6MjA4Nzk3NDQxNX0.vQuRvNYt1BfUAiBdvqJDvcx7i9aLZy06NWaMVC_Ps3w";

const supabase = createClient(url, key);

async function check() {
    console.log("Checking MEDD Tenant...");
    const { data: tenant, error: tErr } = await supabase.from('tenants').select('*').eq('tenant_code', 'MEDD').single();
    if (tErr) console.error("Tenant Error:", tErr.message);
    else console.log("Tenant Found:", tenant.tenant_name, "(" + tenant.tenant_id + ")");

    console.log("\nChecking GMCA Organisation...");
    const { data: org, error: oErr } = await supabase.from('organisations').select('*').eq('organisation_code', 'GMCA').single();
    if (oErr) console.error("Org Error:", oErr.message);
    else console.log("Org Found:", org.organisation_name, "(" + org.organisation_id + ")");

    console.log("\nChecking Profiles...");
    const { data: profiles, error: pErr } = await supabase.schema('core').from('profiles').select('*').limit(5);
    if (pErr) console.error("Profile Error:", pErr.message);
    else if (profiles && profiles.length > 0) {
        profiles.forEach(p => console.log("Profile Found:", p.email, "(Role:", p.role + ")"));
    } else {
        console.log("No Profiles Found.");
    }
}

check();
