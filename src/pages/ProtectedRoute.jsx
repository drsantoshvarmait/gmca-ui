import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkAccess(session) {
      if (!mounted) return

      if (!session?.user) {
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
        .eq("id", session.user.id)
        .single()

      if (data?.role === "admin") {
        setAllowed(true)
      } else {
        setAllowed(false)
      }

      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      checkAccess(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkAccess(session)
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [requireAdmin])

  if (loading) return null

  if (!allowed) {
    return <Navigate to="/login" replace />
  }

  return children
}