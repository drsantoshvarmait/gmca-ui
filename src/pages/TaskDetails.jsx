import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function TaskDetails() {
  const { id } = useParams()

  const [task, setTask] = useState(null)
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTask()
  }, [id])

  async function fetchTask() {
    setLoading(true)

    // 1️⃣ Fetch Task
    const { data: taskData, error: taskError } = await supabase
      .from("task_task")
      .select("*")
      .eq("task_id", id)
      .single()

    if (taskError) {
      console.error("Task fetch error:", taskError)
      setLoading(false)
      return
    }

    setTask(taskData)

    // 2️⃣ Fetch Steps
    const { data: stepData, error: stepError } = await supabase
      .from("task_step_instance")
      .select(`
        *,
        sop_step (
          step_order,
          step_description
        )
      `)
      .eq("task_id", id)
      .order("revision_number", { ascending: true })

    if (stepError) {
      console.error("Step fetch error:", stepError)
    } else {
      setSteps(stepData)
    }

    setLoading(false)
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  if (!task) return <div style={{ padding: 20 }}>Task not found</div>

  return (
    <div style={{ padding: 20 }}>
      <h2>{task.title}</h2>
      <p><strong>Description:</strong> {task.description}</p>
      <p><strong>Status:</strong> {task.status}</p>
      <p><strong>Priority:</strong> {task.priority}</p>

      <hr />

      <h3>Workflow Steps</h3>

      {steps.length === 0 && <p>No steps found.</p>}

      {steps.map((step) => (
        <div
          key={step.task_step_instance_id}
          style={{
            padding: 10,
            marginBottom: 10,
            border: "1px solid #ddd",
            borderRadius: 6,
            background:
              step.step_status === "Completed"
                ? "#e6ffe6"
                : step.step_status === "InProgress"
                ? "#fffbe6"
                : "#f9f9f9"
          }}
        >
          <div><strong>Step:</strong> {step.sop_step?.step_description}</div>
          <div><strong>Order:</strong> {step.sop_step?.step_order}</div>
          <div><strong>Status:</strong> {step.step_status}</div>
          <div><strong>Revision:</strong> {step.revision_number}</div>
          <div><strong>Started:</strong> {step.started_at || "-"}</div>
          <div><strong>Completed:</strong> {step.completed_at || "-"}</div>
        </div>
      ))}
    </div>
  )
}