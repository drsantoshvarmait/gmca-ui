import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function CommunicationDetails() {
  const { id } = useParams()
  const [communication, setCommunication] = useState(null)
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    fetchCommunication()
  }, [])

  async function fetchCommunication() {
    // Get communication
    const { data: commData } = await supabase
      .from("communications")
      .select("*")
      .eq("communication_id", id)
      .single()

    setCommunication(commData)

    // Get linked subjects
    const { data: mappingData } = await supabase
      .from("comm_subjects")
      .select(`
        subject_id,
        comm_subject (
          subject_title
        )
      `)
      .eq("communication_id", id)

    setSubjects(mappingData || [])
  }

  if (!communication) return <p style={{ padding: 20 }}>Loading...</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>Communication Details</h2>

      <p><strong>Type:</strong> {communication.communication_type}</p>

      <p>
        <strong>Date:</strong>{" "}
        {new Date(communication.created_at).toLocaleString()}
      </p>

      <p><strong>Full Text:</strong></p>
      <p>{communication.communication_text}</p>

      <h4>Linked Subjects</h4>

      {subjects.length === 0 && <p>No subjects linked.</p>}

      {subjects.map((item) => (
        <div key={item.subject_id}>
          • {item.comm_subject?.subject_title}
        </div>
      ))}
    </div>
  )
}
