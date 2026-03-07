import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"
import { useNavigate } from "react-router-dom"

export default function AdminWorkflows() {

  const [workflows, setWorkflows] = useState([])
  const navigate = useNavigate()

  async function loadWorkflows() {

    const { data, error } = await supabase
      .from("sop_workflow")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) setWorkflows(data)
  }

  useEffect(() => {
    loadWorkflows()
  }, [])

  return (
    <div>

      <h2>Workflows</h2>

      <button onClick={() => navigate("/workflow-builder")}>
        Create Workflow
      </button>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {workflows.map(w => (
            <tr key={w.workflow_id}>
              <td>{w.workflow_name}</td>
              <td>{w.status}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}