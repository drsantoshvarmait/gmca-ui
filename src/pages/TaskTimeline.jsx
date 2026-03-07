import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function TaskTimeline() {

  const { taskId } = useParams()

  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
  }, [taskId])

  async function loadTimeline() {

    setLoading(true)

    const { data, error } = await supabase
      .from("v_task_timeline")
      .select("*")
      .eq("task_id", taskId)
      .order("event_time", { ascending: true })

    if (error) {
      console.error("Timeline load error:", error)
      setLoading(false)
      return
    }

    setTimeline(data || [])
    setLoading(false)
  }

  return (

    <div style={{ padding: 30 }}>

      <h2>Workflow Timeline</h2>

      {loading && (
        <p>Loading timeline...</p>
      )}

      {!loading && timeline.length === 0 && (
        <p>No history available</p>
      )}

      <div style={{ marginTop: 20 }}>

        {timeline.map((event, index) => (

          <div
            key={index}
            style={{
              borderLeft: "4px solid #2563eb",
              paddingLeft: 20,
              marginBottom: 20,
              position: "relative"
            }}
          >

            <div
              style={{
                position: "absolute",
                left: -8,
                top: 4,
                width: 12,
                height: 12,
                background: "#2563eb",
                borderRadius: "50%"
              }}
            />

            <div style={{ fontWeight: "bold", fontSize: 16 }}>
              {event.event_type}
            </div>

            <div>
              Source: {event.source}
            </div>

            <div>
              Remarks: {event.remarks || "-"}
            </div>

            <div style={{ color: "#666", fontSize: 13 }}>
              {new Date(event.event_time).toLocaleString()}
            </div>

          </div>

        ))}

      </div>

    </div>

  )
}