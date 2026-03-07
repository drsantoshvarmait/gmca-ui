import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function WorkflowBottleneckHeatmap() {

  const [rows, setRows] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {

    const { data, error } = await supabase
      .from("workflow_bottleneck_heatmap")
      .select("*")
      .order("pending_tasks", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setRows(data)
  }

  function getColor(count) {

    if (count <= 2) return "#4CAF50"
    if (count <= 5) return "#FFC107"
    if (count <= 10) return "#FF9800"
    return "#F44336"

  }

  return (

    <div style={{ padding: 20 }}>

      <h2>Workflow Bottleneck Heatmap</h2>

      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 20
      }}>

        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 10 }}>Office</th>
            <th style={{ padding: 10 }}>Pending Tasks</th>
            <th style={{ padding: 10 }}>Bottleneck Level</th>
          </tr>
        </thead>

        <tbody>

          {rows.map(row => (

            <tr key={row.office_id}>

              <td style={{ padding: 10 }}>
                {row.office_name}
              </td>

              <td style={{ textAlign: "center" }}>
                {row.pending_tasks}
              </td>

              <td style={{ padding: 10 }}>

                <div
                  style={{
                    height: 20,
                    width: "100%",
                    background: getColor(row.pending_tasks),
                    borderRadius: 4
                  }}
                />

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )
}