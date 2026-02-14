import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function SchemaView() {
  const [tables, setTables] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTables()
  }, [])

  async function loadTables() {
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
  }

  return (
    <div>
      <h3>Tables</h3>

      {/* 🔥 Error Surface Panel */}
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
      <ul>
        {tables.map((t, i) => (
          <li key={i}>{t.table_name}</li>
        ))}
      </ul>
    </div>
  )
}
