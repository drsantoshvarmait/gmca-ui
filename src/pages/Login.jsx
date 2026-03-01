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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (!data.user.email_confirmed_at) {
      setMessage("Please confirm your email before logging in.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    navigate("/dashboard")
  }

  return (
    <div style={container}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <div style={{ textAlign: "right" }}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <button type="submit" disabled={loading} style={button}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && <p style={{ color: "red" }}>{message}</p>}
    </div>
  )
}

const container = { maxWidth: 400, margin: "100px auto", textAlign: "center" }
const input = { width: "100%", padding: 10, marginBottom: 10 }
const button = {
  width: "100%",
  padding: 10,
  background: "#007bff",
  color: "#fff",
  border: "none"
}