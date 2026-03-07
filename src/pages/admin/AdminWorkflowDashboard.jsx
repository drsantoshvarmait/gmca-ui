import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"

export default function AdminWorkflowDashboard() {

  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [runningWorkflows, setRunningWorkflows] = useState([])

  useEffect(() => {

    loadDashboard()
    loadRunningWorkflows()

    // Realtime subscription
    const channel = supabase
      .channel("workflow-monitor")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "legacy_task_task"
        },
        () => {
          console.log("Task change detected → refreshing dashboard")
          loadDashboard()
          loadRunningWorkflows()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [])

  async function loadDashboard() {

    const { data, error } = await supabase
      .from("v_admin_workflow_dashboard")
      .select("*")
      .single()

    if (error) {
      console.error("Dashboard load error:", error)
      return
    }

    setStats(data)

  }

  async function loadRunningWorkflows() {

    const { data, error } = await supabase
      .from("v_running_workflows_monitor")
      .select("*")
      .order("started_at", { ascending: false })

    if (error) {
      console.error("Running workflows load error:", error)
      return
    }

    setRunningWorkflows(data || [])

  }

  if (!stats) {
    return (
      <div style={{ padding: 20 }}>
        Loading workflow dashboard...
      </div>
    )
  }

  return (

    <div style={{ padding: 20 }}>

      <h2>Workflow Monitoring</h2>

      {/* DASHBOARD CARDS */}

      <div style={{
        display: "flex",
        gap: "20px",
        marginTop: "20px",
        flexWrap: "wrap"
      }}>

        <Card title="Active Workflows" value={stats.active_count} />
        <Card title="Pending Tasks" value={stats.pending_count} />
        <Card title="Overdue Tasks" value={stats.overdue_count} />
        <Card title="Escalations Today" value={stats.escalation_count} />
        <Card title="Completed Workflows" value={stats.completed_count} />

      </div>


      {/* ADMIN ANALYTICS LINKS */}

      <div style={{
        marginTop: "30px",
        display: "flex",
        gap: "15px",
        flexWrap: "wrap"
      }}>

        <button
          style={actionButton}
          onClick={() => navigate("/admin/workflow-heatmap")}
        >
          Workflow Bottleneck Heatmap
        </button>

        <button
          style={actionButton}
          onClick={() => navigate("/admin/control-tower")}
        >
          Control Tower
        </button>

      </div>


      {/* RUNNING WORKFLOWS TABLE */}

      <h3 style={{ marginTop: "40px" }}>Running Workflows</h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px"
        }}
      >

        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th style={th}>Workflow Instance</th>
            <th style={th}>Started By</th>
            <th style={th}>Started At</th>
            <th style={th}>Elapsed</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>

          {runningWorkflows.length === 0 && (
            <tr>
              <td style={td} colSpan="6">
                No running workflows
              </td>
            </tr>
          )}

          {runningWorkflows.map((wf) => (

            <tr key={wf.workflow_instance_id}>

              <td style={td}>
                {wf.workflow_instance_id}
              </td>

              <td style={td}>
                {wf.person_id}
              </td>

              <td style={td}>
                {wf.started_at
                  ? new Date(wf.started_at).toLocaleString()
                  : "-"}
              </td>

              <td style={td}>
                {wf.elapsed_time || "-"}
              </td>

              <td style={td}>
                {wf.current_status}
              </td>

              <td style={td}>

                <button
                  style={smallButton}
                  onClick={() =>
                    navigate(`/timeline/${wf.workflow_instance_id}`)
                  }
                >
                  Timeline
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}

function Card({ title, value }) {

  return (

    <div
      style={{
        background: "#f3f4f6",
        padding: "20px",
        borderRadius: "8px",
        minWidth: "180px"
      }}
    >

      <div style={{ fontSize: "14px", color: "#6b7280" }}>
        {title}
      </div>

      <div style={{ fontSize: "28px", fontWeight: "bold", marginTop: "5px" }}>
        {value}
      </div>

    </div>

  )

}

const actionButton = {
  padding: "10px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
}

const smallButton = {
  padding: "6px 10px",
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
}

const th = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  textAlign: "left"
}

const td = {
  padding: "10px",
  borderBottom: "1px solid #eee"
}