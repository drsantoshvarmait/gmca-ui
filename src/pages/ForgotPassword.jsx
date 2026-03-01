import { useState } from "react"
import { supabase } from "../supabaseClient"
import { Link } from "react-router-dom"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: "http://localhost:5173/reset-password"
      }
    )

    if (error) {
      setMessage("Error: " + error.message)
    } else {
      setMessage("Password reset email sent. Check your inbox.")
    }

    setLoading(false)
  }

  return (
    <div style={container}>
      <h2>Forgot Password</h2>

      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <button type="submit" disabled={loading} style={button}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <Link to="/login">Back to Login</Link>
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
  background: "#007bff",
  color: "#fff",
  border: "none",
  cursor: "pointer"
}