import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function WorkflowInbox() {

  const [tasks, setTasks] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      console.error("User not found")
      return
    }

    const userId = userData.user.id

    const { data, error } = await supabase
      .from("v_my_tasks")
      .select("*")
      .eq("person_id", userId)
      .order("initiated_at", { ascending: false })

    if (error) {
      console.error("Task load error:", error)
      return
    }

    setTasks(data || [])
  }

  function openTask(taskId) {
    navigate(`/task/${taskId}`)
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

              <td>{t.sop_title}</td>

              <td>{t.step_description}</td>

              <td>{t.task_status}</td>

              <td>
                {new Date(t.initiated_at).toLocaleString()}
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