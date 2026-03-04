import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function TaskTimeline() {

  const { taskId } = useParams()

  const [history, setHistory] = useState([])

  useEffect(() => {
    loadTimeline()
  }, [])

  async function loadTimeline() {

    const { data, error } = await supabase
      .from("v_task_history_detailed")
      .select("*")
      .eq("task_id", taskId)
      .order("action_at", { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setHistory(data || [])
  }

  return (

    <div style={{ padding: 30 }}>

      <h2>Workflow Timeline</h2>

      <div style={{ marginTop: 20 }}>

        {history.length === 0 && (
          <p>No history available</p>
        )}

        {history.map((h, index) => (

          <div
            key={index}
            style={{
              borderLeft: "4px solid #2563eb",
              paddingLeft: 20,
              marginBottom: 20
            }}
          >

            <div style={{ fontWeight: "bold" }}>
              {h.step_description}
            </div>

            <div>
              Officer: {h.person_name || "Unknown"}
            </div>

            <div>
              Action: {h.action}
            </div>

            <div>
              Remarks: {h.remarks || "-"}
            </div>

            <div style={{ color: "#666" }}>
              {new Date(h.action_at).toLocaleString()}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}