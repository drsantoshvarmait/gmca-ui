import { supabase } from "../services/supabaseClient"

export async function callAIGateway(message) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("User not authenticated")
  }

  const response = await fetch(
    "https://ulfrylptbnrfewodzhck.supabase.co/functions/v1/ai-gateway",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message }),
    }
  )

  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text)
  }
}