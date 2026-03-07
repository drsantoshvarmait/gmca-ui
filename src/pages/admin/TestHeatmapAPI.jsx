import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function TestHeatmapAPI() {

  const [rows, setRows] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {

    const { data, error } = await supabase
      .from("workflow_bottleneck_heatmap")
      .select("*")

    if (error) {
      console.error("Supabase error:", error)
      return
    }

    console.log("Heatmap data:", data)
    setRows(data)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Heatmap API Test</h2>

      <pre>
        {JSON.stringify(rows, null, 2)}
      </pre>

    </div>
  )
}