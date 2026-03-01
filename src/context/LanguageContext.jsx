import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    async function init() {
      try {
        const { data: userData } = await supabase.auth.getUser()

        if (!userData?.user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language_code")
          .eq("user_id", userData.user.id)
          .maybeSingle()

        if (profile?.preferred_language_code) {
          setLanguage(profile.preferred_language_code)
        }
      } catch (err) {
        console.error("Language init error:", err)
      }
    }

    init()
  }, [])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}