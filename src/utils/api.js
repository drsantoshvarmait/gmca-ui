// src/utils/api.js

import { supabase } from "../supabaseClient"

export async function callAIGateway(message) {

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("User not authenticated")
  }

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/ai-gateway`,
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