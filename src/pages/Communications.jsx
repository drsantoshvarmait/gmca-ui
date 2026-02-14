import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import { Link } from "react-router-dom"

export default function Communications() {
  const [communications, setCommunications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommunications()
  }, [])

  async function fetchCommunications() {
    const { data, error } = await supabase
      .from("communications")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setCommunications(data || [])
    }

    setLoading(false)
  }

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>Communications</h2>

      {communications.length === 0 && <p>No communications found.</p>}

      {communications.map((comm) => (
        <div
          key={comm.communication_id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10
          }}
        >
          <p><strong>Type:</strong> {comm.communication_type}</p>

          <p>
            <strong>Text:</strong>{" "}
            {comm.communication_text?.slice(0, 100)}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(comm.created_at).toLocaleString()}
          </p>

          <Link to={`/communication/${comm.communication_id}`}>
            View Details
          </Link>
        </div>
      ))}
    </div>
  )
}
