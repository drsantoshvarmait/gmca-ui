import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("ENV URL:", supabaseUrl)
console.log("ENV KEY:", supabaseAnonKey)

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
