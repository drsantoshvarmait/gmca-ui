import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function WorkflowControlTower() {

  const [summary, setSummary] = useState(null)
  const [offices, setOffices] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [activity, setActivity] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {

    const { data: s } = await supabase
      .from("v_admin_workflow_dashboard")
      .select("*")
      .single()

    const { data: o } = await supabase
      .from("workflow_bottleneck_heatmap")
      .select("*")
      .order("pending_tasks", { ascending: false })
      .limit(5)

    const { data: w } = await supabase
      .from("v_running_workflows_monitor")
      .select("*")
      .limit(10)

    const { data: a } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    setSummary(s)
    setOffices(o || [])
    setWorkflows(w || [])
    setActivity(a || [])

  }

  if (!summary) return <div style={{ padding:20 }}>Loading...</div>

  return (

    <div style={{ padding:20 }}>

      <h2>Workflow Control Tower</h2>

      {/* HEALTH CARDS */}

      <div style={{ display:"flex", gap:20, marginTop:20, flexWrap:"wrap" }}>

        <Card title="Active Workflows" value={summary.active_count}/>
        <Card title="Pending Tasks" value={summary.pending_count}/>
        <Card title="Overdue Tasks" value={summary.overdue_count}/>
        <Card title="Escalations Today" value={summary.escalation_count}/>

      </div>

      {/* BOTTLENECK OFFICES */}

      <h3 style={{ marginTop:40 }}>Bottleneck Offices</h3>

      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <tbody>

        {offices.map(o => (

          <tr key={o.office_id}>
            <td style={td}>{o.office_name}</td>
            <td style={td}>{o.pending_tasks}</td>
          </tr>

        ))}

        </tbody>
      </table>

      {/* RUNNING WORKFLOWS */}

      <h3 style={{ marginTop:40 }}>Running Workflows</h3>

      <table style={{ width:"100%", borderCollapse:"collapse" }}>

        <thead>
          <tr>
            <th style={th}>Instance</th>
            <th style={th}>Started By</th>
            <th style={th}>Elapsed</th>
            <th style={th}>Status</th>
          </tr>
        </thead>

        <tbody>

        {workflows.map(w => (

          <tr key={w.workflow_instance_id}>
            <td style={td}>{w.workflow_instance_id}</td>
            <td style={td}>{w.person_id}</td>
            <td style={td}>{w.elapsed_time}</td>
            <td style={td}>{w.current_status}</td>
          </tr>

        ))}

        </tbody>

      </table>

      {/* ACTIVITY STREAM */}

      <h3 style={{ marginTop:40 }}>Live Activity</h3>

      {activity.map((a,i)=>(
        <div key={i} style={{ padding:"6px 0" }}>
          {new Date(a.created_at).toLocaleTimeString()} — {a.action}
        </div>
      ))}

    </div>

  )

}

function Card({title,value}) {

  return (

    <div style={{
      background:"#f3f4f6",
      padding:"20px",
      borderRadius:"8px",
      minWidth:"180px"
    }}>

      <div style={{ fontSize:14, color:"#6b7280" }}>
        {title}
      </div>

      <div style={{ fontSize:28, fontWeight:"bold" }}>
        {value}
      </div>

    </div>

  )

}

const th = {
padding:"10px",
borderBottom:"1px solid #ddd",
textAlign:"left"
}

const td = {
padding:"10px",
borderBottom:"1px solid #eee"
}