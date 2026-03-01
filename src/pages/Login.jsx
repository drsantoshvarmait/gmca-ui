import { useState } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate, Link } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    // 🔐 Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    if (!user.email_confirmed_at) {
      setMessage("Please confirm your email before logging in.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // 🔎 Load multi-tenant membership from core.app_users
    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("tenant_id, role_id, is_active")
      .eq("user_id", user.id)
      .single()

    if (appUserError) {
      console.error("App user error:", appUserError)
      setMessage("Error loading profile.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (!appUser) {
      setMessage("User is not assigned to any tenant.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (!appUser.is_active) {
      setMessage("User account is inactive.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // 🏢 Store tenant + role locally (optional)
    localStorage.setItem("tenant_id", appUser.tenant_id)
    localStorage.setItem("role_id", appUser.role_id)

    setLoading(false)
    navigate("/dashboard")
  }

  return (
    <div style={container}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={input}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={input}
          />
        </div>

        <div style={{ textAlign: "right", marginTop: 8 }}>
          <Link to="/forgot-password" style={forgotLink}>
            Forgot Password?
          </Link>
        </div>

        <div style={{ marginTop: 15 }}>
          <button
            type="submit"
            disabled={loading}
            style={button}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>

      {message && (
        <p style={errorText}>
          {message}
        </p>
      )}

      <div style={{ marginTop: 15 }}>
        <span>Don't have an account? </span>
        <Link to="/signup">Sign up</Link>
      </div>
    </div>
  )
}

/* ---------------- Styles ---------------- */

const container = {
  maxWidth: 400,
  margin: "100px auto",
  padding: 25,
  borderRadius: 8,
  boxShadow: "0 4px 10px rgba(0,0,0,0.08)"
}

const input = {
  width: "100%",
  padding: 8,
  marginTop: 4
}

const button = {
  width: "100%",
  padding: 10,
  background: "#007bff",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  borderRadius: 4
}

const forgotLink = {
  fontSize: 14,
  textDecoration: "none"
}

const errorText = {
  marginTop: 15,
  color: "red"
}