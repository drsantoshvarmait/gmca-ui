import { useState } from "react"
import { supabase } from "../supabaseClient"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Signup successful. Please check your email to confirm.")
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>Create Account</h2>

      <form onSubmit={handleSignup}>
        <div>
          <label>Email</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Password</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        <div style={{ marginTop: 15 }}>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 8 }}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </div>
      </form>

      {message && (
        <p style={{ marginTop: 15 }}>
          {message}
        </p>
      )}
    </div>
  )
}
