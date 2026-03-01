import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function MetaDashboard() {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMeta()
  }, [])

  async function loadMeta() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.rpc("sgv_get_meta_summary")

    if (error) {
      console.error(error)
      setError(error.message)
    } else {
      setMeta(data)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>🛰 SGV Meta Dashboard</h3>

      {error && (
        <div style={{
          background: "#ffe6e6",
          color: "#900",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "6px"
        }}>
          ❌ {error}
        </div>
      )}

      {loading && <p>Loading meta data...</p>}

      {meta && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginTop: "15px"
        }}>
          <Card title="Schema Version" value={meta.current_version || 1} />
          <Card title="Last Refreshed" value={meta.last_refreshed_at || "-"} />
          <Card title="Tables" value={meta.tables_count} />
          <Card title="Functions" value={meta.functions_count} />
          <Card title="Policies" value={meta.policies_count} />
          <Card title="Triggers" value={meta.triggers_count} />
        </div>
      )}
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div style={{
      background: "#f5f7fa",
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
    }}>
      <h4 style={{ margin: 0 }}>{title}</h4>
      <p style={{
        fontSize: "18px",
        fontWeight: "600",
        marginTop: "8px"
      }}>
        {value}
      </p>
    </div>
  )
}
