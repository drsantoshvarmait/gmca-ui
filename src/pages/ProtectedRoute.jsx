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
    async function checkAccess() {
      const {
        data: { user }
      } = await supabase.auth.getUser()

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

    checkAccess()
  }, [requireAdmin])

  if (loading) return <p>Checking access...</p>

  return allowed ? children : <Navigate to="/" />
}
