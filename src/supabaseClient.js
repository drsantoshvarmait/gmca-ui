import { createClient } from "@supabase/supabase-js"

const isProd = import.meta.env.VITE_APP_ENV === "PROD" || window.location.hostname === "gmca-ui.vercel.app";

const supabaseUrl = isProd 
    ? "https://aaritujhokbxezuxcqnm.supabase.co" 
    : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = isProd 
    ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcml0dWpob2tieGV6dXhjcW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTg0MTUsImV4cCI6MjA4Nzk3NDQxNX0.vQuRvNYt1BfUAiBdvqJDvcx7i9aLZy06NWaMVC_Ps3w" 
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL initialized:", supabaseUrl)
console.log("App Mode:", isProd ? "PROD (Forced)" : "ENV-BASED")

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
