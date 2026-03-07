import { supabase } from "../supabaseClient"

export async function getCurrentPersonId() {

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError) {
    console.error("Auth error:", userError)
    return null
  }

  const email = userData?.user?.email

  if (!email) return null

  const { data, error } = await supabase
    .from("core_person")
    .select("person_id")
    .eq("email", email)
    .single()

  if (error) {
    console.error("Person lookup error:", error)
    return null
  }

  return data?.person_id
}