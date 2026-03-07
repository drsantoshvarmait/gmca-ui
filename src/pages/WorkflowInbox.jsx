import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { getCurrentPersonId } from "../utils/personUtils"

export default function WorkflowInbox() {

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {

    try {

      setLoading(true)

      const personId = await getCurrentPersonId()

      if (!personId) {
        console.error("Person not found for logged-in user")
        return
      }

      const { data, error } = await supabase
        .from("workflow_tasks")
        .select(`
          task_id,
          step_name,
          task_status,
          created_at,
          workflow_instances (
            sop_id
          )
        `)
        .eq("assigned_person_id", personId)
        .eq("task_status", "pending")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Task load error:", error)
        return
      }

      setTasks(data || [])

    } catch (err) {

      console.error("Workflow inbox error:", err)

    } finally {

      setLoading(false)

    }

  }

  function openTask(taskId) {
    navigate(`/task/${taskId}`)
  }

  if (loading) {
    return <p style={{ padding: 30 }}>Loading tasks...</p>
  }

  return (

    <div style={{ padding: 30 }}>

      <h2>Workflow Inbox</h2>

      <table border="1" cellPadding="10" style={{ width: "100%" }}>

        <thead>
          <tr>
            <th>SOP</th>
            <th>Step</th>
            <th>Status</th>
            <th>Started</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {tasks.length === 0 && (
            <tr>
              <td colSpan="5">No tasks pending</td>
            </tr>
          )}

          {tasks.map(t => (

            <tr key={t.task_id}>

              <td>{t.workflow_instances?.sop_id || "-"}</td>

              <td>{t.step_name}</td>

              <td>{t.task_status}</td>

              <td>
                {new Date(t.created_at).toLocaleString()}
              </td>

              <td>

                <button
                  onClick={() => openTask(t.task_id)}
                  style={{
                    padding: "6px 12px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Open
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}