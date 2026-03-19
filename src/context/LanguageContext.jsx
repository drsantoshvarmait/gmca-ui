import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

const LanguageContext = createContext()

export function LanguageProvider({ children }) {

  const [language, setLanguageState] = useState("en")
  const [user, setUser] = useState(null)

  useEffect(() => {

    async function init() {

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) return

      loadLanguage(user.id)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {

        const newUser = session?.user ?? null
        setUser(newUser)

        if (newUser) {
          loadLanguage(newUser.id)
        } else {
          setLanguageState("en")
        }
      }
    )

    return () => listener.subscription.unsubscribe()

  }, [])


  async function loadLanguage(userId) {

    const { data: profile, error } = await supabase
      .schema("core")
      .from("profiles")
      .select("preferred_language_code")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error("Language fetch error:", error)
      return
    }

    if (profile?.preferred_language_code) {
      setLanguageState(profile.preferred_language_code)
    } else {
      setLanguageState("en")
    }
  }


  async function setLanguage(newLang) {

    setLanguageState(newLang)

    if (!user) return

    const { error } = await supabase
      .schema("core")
      .from("profiles")
      .update({ preferred_language_code: newLang })
      .eq("id", user.id)

    if (error) {
      console.error("Language update error:", error)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}