import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../supabaseClient"
import useMetaRealtime from "./useMetaRealtime"

export default function SchemaView() {
  const [tables, setTables] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // 🔁 Stable fetch function (important for realtime hook)
  const loadTables = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.rpc("sgv_get_schema_tables")

    if (error) {
      console.error("Schema fetch error:", error)
      setError(error.message)
    } else {
      setTables(data || [])
    }

    setLoading(false)
  }, [])

  // 📦 Initial load
  useEffect(() => {
    loadTables()
  }, [loadTables])

  // 🔥 Auto-refresh when meta tables change
  useMetaRealtime(loadTables)

  return (
    <div style={{ padding: 10 }}>
      <h3>Tables</h3>

      {/* ❌ Error Surface Panel */}
      {error && (
        <div
          style={{
            background: "#ffe6e6",
            color: "#900",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "6px",
            fontWeight: "500"
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* 🔄 Loading Indicator */}
      {loading && <p>Loading...</p>}

      {/* 📋 Tables List */}
      {!loading && tables.length === 0 && (
        <p style={{ color: "#666" }}>No tables found.</p>
      )}

      <ul>
        {tables.map((t, i) => (
          <li key={i}>{t.table_name}</li>
        ))}
      </ul>
    </div>
  )
}
