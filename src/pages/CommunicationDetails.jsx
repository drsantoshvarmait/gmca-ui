import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { startWorkflow } from "../utils/workflowEngine"
import { getCurrentPersonId } from "../utils/personUtils"

export default function CommunicationDetails() {

  const { id } = useParams()

  const [communication, setCommunication] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [startingWorkflow, setStartingWorkflow] = useState(false)

  useEffect(() => {
    fetchCommunication()
  }, [])

  async function fetchCommunication() {

    // Get communication
    const { data: commData, error: commError } = await supabase
      .from("communications")
      .select("*")
      .eq("communication_id", id)
      .single()

    if (commError) {
      console.error("Communication fetch error:", commError)
      return
    }

    setCommunication(commData)

    // Get linked subjects
    const { data: mappingData, error: mappingError } = await supabase
      .from("comm_subjects")
      .select(`
        subject_id,
        comm_subject (
          subject_title
        )
      `)
      .eq("communication_id", id)

    if (mappingError) {
      console.error("Subject fetch error:", mappingError)
    }

    setSubjects(mappingData || [])
  }

  async function handleStartWorkflow() {

    try {

      setStartingWorkflow(true)

      const personId = await getCurrentPersonId()

      if (!personId) {
        alert("Unable to determine logged-in person")
        return
      }

      // Use first subject if available
      const subjectId = subjects?.[0]?.subject_id || null

      const instanceId = await startWorkflow({
        eventId: communication.event_id || null,
        sopId: communication.sop_id || null,
        subjectId: subjectId,
        personId
      })

      console.log("Workflow started:", instanceId)

      alert("Workflow started successfully")

    } catch (err) {

      console.error("Workflow start failed:", err)
      alert("Failed to start workflow")

    } finally {
      setStartingWorkflow(false)
    }

  }

  if (!communication)
    return <p style={{ padding: 20 }}>Loading...</p>

  return (

    <div style={{ padding: 20 }}>

      <h2>Communication Details</h2>

      <p>
        <strong>Type:</strong> {communication.communication_type}
      </p>

      <p>
        <strong>Date:</strong>{" "}
        {new Date(communication.created_at).toLocaleString()}
      </p>

      <p>
        <strong>Full Text:</strong>
      </p>

      <p>{communication.communication_text}</p>

      <h4>Linked Subjects</h4>

      {subjects.length === 0 && <p>No subjects linked.</p>}

      {subjects.map((item) => (
        <div key={item.subject_id}>
          • {item.comm_subject?.subject_title}
        </div>
      ))}

      <hr style={{ margin: "20px 0" }} />

      <button
        onClick={handleStartWorkflow}
        disabled={startingWorkflow}
        style={{
          padding: "10px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        {startingWorkflow ? "Starting Workflow..." : "Start Workflow"}
      </button>

    </div>

  )

}