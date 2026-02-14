import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function FunctionsView() {
  const [functions, setFunctions] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFunctions()
  }, [])

  async function loadFunctions() {
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
  }

  return (
    <div>
      <h3>Functions</h3>

      {error && (
        <div style={errorStyle}>
          ❌ {error}
        </div>
      )}

      {loading && <p>Loading...</p>}

      <ul>
        {functions.map((fn, i) => (
          <li key={i}>
            {fn.function_name}
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
