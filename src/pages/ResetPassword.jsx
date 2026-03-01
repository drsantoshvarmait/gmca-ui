import { useState } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  async function handleUpdate(e) {
    e.preventDefault()

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setMessage("Error: " + error.message)
    } else {
      setMessage("Password updated successfully.")
      setTimeout(() => navigate("/login"), 2000)
    }
  }

  return (
    <div style={container}>
      <h2>Reset Password</h2>

      <form onSubmit={handleUpdate}>
        <input
          type="password"
          placeholder="Enter new password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <button type="submit" style={button}>
          Update Password
        </button>
      </form>

      {message && <p>{message}</p>}
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