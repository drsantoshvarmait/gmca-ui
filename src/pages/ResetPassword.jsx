import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // 🔥 Detect recovery token in URL hash manually
    const hash = window.location.hash

    if (hash && hash.includes("access_token")) {
      setIsRecovery(true)
    } else {
      setMessage("Invalid or expired reset link.")
    }
  }, [])

  async function handleUpdate(e) {
    e.preventDefault()

    if (!isRecovery) return

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.updateUser({
      password
    })

    setLoading(false)

    if (error) {
      setMessage("Error: " + error.message)
    } else {
      setMessage("Password updated successfully.")
      setTimeout(() => navigate("/login"), 2000)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
      <h2>Reset Password</h2>

      {!isRecovery ? (
        <p>{message || "Validating reset link..."}</p>
      ) : (
        <form onSubmit={handleUpdate}>
          <input
            type="password"
            placeholder="Enter new password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 15 }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 10,
              background: "#28a745",
              color: "#fff",
              border: "none"
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}

      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  )
}