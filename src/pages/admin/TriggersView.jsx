import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../supabaseClient"
import useMetaRealtime from "./useMetaRealtime"

export default function TriggersView() {
  const [triggers, setTriggers] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // 🔁 Stable fetch function
  const loadTriggers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.rpc("sgv_get_triggers")

    if (error) {
      console.error("Triggers fetch error:", error)
      setError(error.message)
    } else {
      setTriggers(data || [])
    }

    setLoading(false)
  }, [])

  // 📦 Initial load
  useEffect(() => {
    loadTriggers()
  }, [loadTriggers])

  // 🔥 Auto-refresh
  useMetaRealtime(loadTriggers)

  return (
    <div style={{ padding: 10 }}>
      <h3>Triggers</h3>

      {error && (
        <div style={errorStyle}>
          ❌ {error}
        </div>
      )}

      {loading && <p>Loading...</p>}

      {!loading && triggers.length === 0 && (
        <p style={{ color: "#666" }}>No triggers found.</p>
      )}

      <ul style={{ listStyleType: "none", padding: 0 }}>
        {triggers.map((trg, i) => (
          <li
            key={i}
            style={{
              padding: "10px",
              marginBottom: "6px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ fontWeight: "700", color: "#1e293b" }}>{trg.trigger_name || trg.tgname}</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Table: <span style={{ color: "#3b82f6" }}>{trg.table_name || trg.tablename || trg.relname}</span> | Schema: <span style={{ color: "#94a3b8" }}>{trg.schema || trg.schemaname || "public"}</span>
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

