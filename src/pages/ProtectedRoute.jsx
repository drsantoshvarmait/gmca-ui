import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function ProtectedRoute({
  children,
  requireAdmin = false
}) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let subscription

    async function checkAccess(sessionUser) {
      const user = sessionUser

      if (!user) {
        setAllowed(false)
        setLoading(false)
        return
      }

      if (!requireAdmin) {
        setAllowed(true)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (data?.role === "admin") {
        setAllowed(true)
      } else {
        setAllowed(false)
      }

      setLoading(false)
    }

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      checkAccess(data.session?.user || null)
    })

    // Listen for login/logout
    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkAccess(session?.user || null)
      }
    )

    subscription = data.subscription

    return () => {
      subscription?.unsubscribe()
    }
  }, [requireAdmin])

  if (loading) return <p>Checking access...</p>

  if (!allowed) {
    return <Navigate to="/login" replace />
  }

  return children
}