import { createClient } from "@supabase/supabase-js"

const hostname = window.location.hostname;
const isStaging = hostname.includes("staging.vercel.app") || import.meta.env.VITE_APP_ENV === "STAGING";
const isProd = (hostname === "gmca-ui.vercel.app" || import.meta.env.VITE_APP_ENV === "PROD") && !isStaging;

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (isProd) {
    supabaseUrl = "https://aaritujhokbxezuxcqnm.supabase.co";
    supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcml0dWpob2tieGV6dXhjcW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTg0MTUsImV4cCI6MjA4Nzk3NDQxNX0.vQuRvNYt1BfUAiBdvqJDvcx7i9aLZy06NWaMVC_Ps3w";
} else if (isStaging && !supabaseUrl) {
    // Fallback if env vars missing
    supabaseUrl = "https://risrmpdbvoafowdvnonn.supabase.co";
    supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc3JtcGRidm9hZm93ZHZub25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTA2MjEsImV4cCI6MjA4Njc2NjYyMX0.Rsc85qFmB8-xN8iP4T-N-RElHhA";
}

console.log("Supabase URL initialized:", supabaseUrl);
console.log("App Mode:", isProd ? "PROD" : (isStaging ? "STAGING" : "LOCAL"));

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        db: {
            schema: "public"
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    }
)

// Schema helpers
export const core = supabase.schema("core")
export const task = supabase.schema("task")
export const finance = supabase.schema("finance")
export const audit = supabase.schema("audit")
export const publicDb = supabase.schema("public")
