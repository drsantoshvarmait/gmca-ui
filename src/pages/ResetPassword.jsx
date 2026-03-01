import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const navigate = useNavigate()

  // Check if reset session exists
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        setMessage("Invalid or expired reset link.")
      } else {
        setSessionReady(true)
      }
    }

    checkSession()
  }, [])

  async function handleUpdate(e) {
    e.preventDefault()

    if (!sessionReady) {
      setMessage("Reset session not ready.")
      return
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    setLoading(false)

    if (error) {
      setMessage("Error: " + error.message)
    } else {
      setMessage("Password updated successfully. Redirecting...")
      setTimeout(() => navigate("/login"), 2000)
    }
  }

  return (
    <div style={container}>
      <h2>Reset Password</h2>

      {!sessionReady ? (
        <p>{message || "Validating reset link..."}</p>
      ) : (
        <form onSubmit={handleUpdate}>
          <input
            type="password"
            placeholder="Enter new password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />

          <button type="submit" style={button} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}

      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  )
}

const container = {
  maxWidth: 400,
  margin: "100px auto",
  padding: 20,
  textAlign: "center"
}

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 15
}

const button = {
  width: "100%",
  padding: 10,
  background: "#28a745",
  color: "#fff",
  border: "none",
  cursor: "pointer"
}