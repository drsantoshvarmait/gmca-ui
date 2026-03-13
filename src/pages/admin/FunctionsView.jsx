import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../supabaseClient"
import useMetaRealtime from "./useMetaRealtime"

export default function FunctionsView() {
  const [functions, setFunctions] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // 🔁 Stable fetch function
  const loadFunctions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.rpc("sgv_get_functions")

    if (error) {
      console.error("Functions fetch error:", error)
      setError(error.message)
    } else {
      setFunctions(data || [])
    }

    setLoading(false)
  }, [])

  // 📦 Initial load
  useEffect(() => {
    loadFunctions()
  }, [loadFunctions])

  // 🔥 Auto-refresh when meta tables/functions change
  useMetaRealtime(loadFunctions)

  return (
    <div style={{ padding: 10 }}>
      <h3>Functions</h3>

      {/* ❌ Error Surface Panel */}
      {error && (
        <div style={errorStyle}>
          ❌ {error}
        </div>
      )}

      {/* 🔄 Loading Indicator */}
      {loading && <p>Loading...</p>}

      {/* 📋 Functions List */}
      {!loading && functions.length === 0 && (
        <p style={{ color: "#666" }}>No functions found in metadata.</p>
      )}

      <ul style={{ listStyleType: "none", padding: 0 }}>
        {functions.map((fn, i) => (
          <li
            key={i}
            style={{
              padding: "8px 12px",
              marginBottom: "4px",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ color: "#3b82f6" }}>ƒ</span>
            <span style={{ fontWeight: "500" }}>{fn.function_name || fn.routine_name || fn.proname || fn.name || "Unnamed Function"}</span>
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>({fn.schema || fn.routine_schema || fn.nspname || "public"})</span>
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

