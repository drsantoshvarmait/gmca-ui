import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function TriggersView() {
  const [triggers, setTriggers] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTriggers()
  }, [])

  async function loadTriggers() {
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
  }

  return (
    <div>
      <h3>Triggers</h3>

      {error && (
        <div style={errorStyle}>
          ❌ {error}
        </div>
      )}

      {loading && <p>Loading...</p>}

      <ul>
        {triggers.map((trg, i) => (
          <li key={i}>
            {trg.table_name} → {trg.trigger_name}
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
