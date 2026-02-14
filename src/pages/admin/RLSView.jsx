import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function RLSView() {
  const [policies, setPolicies] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPolicies()
  }, [])

  async function loadPolicies() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.rpc("sgv_get_rls_policies")

    if (error) {
      console.error("RLS fetch error:", error)
      setError(error.message)
    } else {
      setPolicies(data || [])
    }

    setLoading(false)
  }

  return (
    <div>
      <h3>RLS Policies</h3>

      {error && (
        <div style={errorStyle}>
          ❌ {error}
        </div>
      )}

      {loading && <p>Loading...</p>}

      <ul>
        {policies.map((p, i) => (
          <li key={i}>
            {p.table_name} → {p.policy_name}
          </li>
        ))}
      </ul>
    </div>
  )
}

const errorStyle = {
  background: "#ffe6e6",
  color: "#900",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  fontWeight: "500"
}
