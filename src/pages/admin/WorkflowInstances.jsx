import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function WorkflowInstances() {

  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadInstances() {

    setLoading(true)

    const { data, error } = await supabase
      .from("workflow_instance")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) {
      setInstances(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadInstances()
  }, [])

  if (loading) {
    return <div>Loading workflow instances...</div>
  }

  return (
    <div>

      <h3>Workflow Instances</h3>

      <table border="1" cellPadding="6">

        <thead>
          <tr>
            <th>ID</th>
            <th>SOP ID</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>

          {instances.map((i) => (
            <tr key={i.instance_id}>
              <td>{i.instance_id}</td>
              <td>{i.sop_id}</td>
              <td>{i.status}</td>
              <td>{new Date(i.created_at).toLocaleString()}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}