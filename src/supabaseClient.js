import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://ulfrylptbnrfewodzhck.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZnJ5bHB0Ym5yZmV3b2R6aGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzIyMzUsImV4cCI6MjA4NTA0ODIzNX0._qhJJ2KREGeUSD4EX-dCtstCq8J88zJZPk14T9qrh60"

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)
