import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../supabaseClient"
import useMetaRealtime from "./useMetaRealtime"

export default function RLSView() {
  const [policies, setPolicies] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // 🔁 Stable fetch function
  const loadPolicies = useCallback(async () => {
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
  }, [])

  // 📦 Initial load
  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  // 🔥 Auto-refresh
  useMetaRealtime(loadPolicies)

  return (
    <div style={{ padding: 10 }}>
      <h3>RLS Policies</h3>

      {error && (
        <div style={errorStyle}>
          ❌ {error}
        </div>
      )}

      {loading && <p>Loading...</p>}

      {!loading && policies.length === 0 && (
        <p style={{ color: "#666" }}>No RLS policies found.</p>
      )}

      <ul style={{ listStyleType: "none", padding: 0 }}>
        {policies.map((p, i) => (
          <li
            key={i}
            style={{
              padding: "10px",
              marginBottom: "8px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>{p.policy_name || p.policyname || "Untitled Policy"}</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Table: <span style={{ color: "#3b82f6" }}>{p.table_name || p.tablename}</span> | Command: <span style={{ color: "#059669" }}>{p.cmd || "ALL"}</span>
            </div>
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

