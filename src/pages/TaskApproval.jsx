import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { callAIGateway } from "../utils/api"

export default function TaskApproval() {

  const { taskId } = useParams()
  const navigate = useNavigate()

  const [task, setTask] = useState(null)
  const [remarks, setRemarks] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTask()
  }, [])

  async function loadTask() {

    const { data, error } = await supabase
      .from("task")
      .select(`
        *,
        workflow_instances(
          *,
          workflow_definitions(name)
        )
      `)
      .eq("id", taskId)
      .single()

    if (!error) setTask(data)
  }

  async function executeAction(actionType) {

    setLoading(true)

    let documentUrl = null

    if (file) {
      const filePath = `workflow_docs/${taskId}/${file.name}`

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file)

      if (!uploadError) {
        const { data } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath)

        documentUrl = data.publicUrl
      }
    }

    const { error } = await supabase.rpc("execute_step_action", {
      p_task_id: taskId,
      p_action: actionType,
      p_remarks: remarks,
      p_document_url: documentUrl
    })

    setLoading(false)

    if (!error) {
      navigate("/dashboard")
    } else {
      alert("Action failed")
    }
  }

  if (!task) return <div>Loading...</div>

  return (
    <div className="p-6">

      <h1 className="text-xl font-bold mb-4">
        Task Approval
      </h1>

      <div className="bg-white p-4 rounded shadow mb-4">

        <p><b>Task:</b> {task.title}</p>
        <p><b>Status:</b> {task.status}</p>

      </div>

      <textarea
        className="w-full border p-2 mb-4"
        placeholder="Remarks"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />

      <div className="flex gap-4">

        <button
          onClick={() => executeAction("approve")}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Approve
        </button>

        <button
          onClick={() => executeAction("reject")}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Reject
        </button>

        <button
            onClick={() => navigate(`/timeline/${taskId}`)}
            style={{
                padding: "6px 12px",
                background: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "4px"
            }}
            >
            View Timeline
        </button>

      </div>

    </div>
  )
}