import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aaritujhokbxezuxcqnm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcml0dWpob2tieGV6dXhjcW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTg0MTUsImV4cCI6MjA4Nzk3NDQxNX0.vQuRvNYt1BfUAiBdvqJDvcx7i9aLZy06NWaMVC_Ps3w'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const email = 'drsantoshvarmait@gmail.com'
    const password = 'Gaurav1*'
    
    console.log("Signing in...")
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
        console.error("Auth error:", authError.message)
        return
    }
    
    console.log("Fetching user_org_roles...")
    const { data, error } = await supabase
      .from("user_org_roles")
      .select(`
        organisation_id,
        role,
        organisations (
          organisation_name,
          organisation_code,
          tenant_id
        )
      `)
      .eq("user_id", auth.user.id)

    if (error) {
        console.error("Fetch error:", error.message)
    } else {
        console.log("Data structure:", JSON.stringify(data, null, 2))
    }
}

main()
