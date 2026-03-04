import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function WorkflowInbox() {

  const [tasks, setTasks] = useState([])

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {

    const { data: user } = await supabase.auth.getUser()

    const { data } = await supabase
      .from("v_my_tasks")
      .select("*")
      .eq("person_id", user.user.id)

    setTasks(data || [])
  }

  return (

    <div style={{ padding: 30 }}>

      <h2>Workflow Inbox</h2>

      <table border="1" cellPadding="10">

        <thead>
          <tr>
            <th>SOP</th>
            <th>Step</th>
            <th>Status</th>
            <th>Started</th>
          </tr>
        </thead>

        <tbody>

          {tasks.map(t => (
            <tr key={t.task_id}>
              <td>{t.sop_title}</td>
              <td>{t.step_description}</td>
              <td>{t.task_status}</td>
              <td>{new Date(t.initiated_at).toLocaleString()}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}