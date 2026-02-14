import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function SubjectChronology() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [subject, setSubject] = useState(null)
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubject()
    fetchLetters()
  }, [])

  async function fetchSubject() {
    const { data } = await supabase
      .from("comm_subject")
      .select("subject_title")
      .eq("subject_id", id)
      .single()

    setSubject(data)
  }

  async function fetchLetters() {
    const { data, error } = await supabase
      .from("letter_subjects")
      .select(`
        letters (
          letter_id,
          letter_number,
          created_at,
          status,
          organisations ( organisation_name )
        )
      `)
      .eq("subject_id", id)
      .order("created_at", { foreignTable: "letters", ascending: false })

    setLoading(false)

    if (!error && data) {
      const extracted = data.map(item => item.letters)
      setLetters(extracted)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ maxWidth: 900, margin: "auto" }}>
      <h2>Subject Chronology</h2>

      <h3 style={{ color: "#007bff" }}>
        {subject?.subject_title}
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ background: "#f2f2f2" }}>
            <th style={th}>Letter No</th>
            <th style={th}>Organisation</th>
            <th style={th}>Date</th>
            <th style={th}>Status</th>
            <th style={th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {letters.map(letter => (
            <tr key={letter.letter_id}>
              <td style={td}>{letter.letter_number}</td>
              <td style={td}>
                {letter.organisations?.organisation_name}
              </td>
              <td style={td}>
                {new Date(letter.created_at).toLocaleDateString()}
              </td>
              <td style={td}>{letter.status}</td>
              <td style={td}>
                <button
                  onClick={() =>
                    navigate(`/submit-letter?letter_id=${letter.letter_id}`)
                  }
                  style={btn}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const th = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left"
}

const td = {
  padding: "8px",
  border: "1px solid #ddd"
}

const btn = {
  background: "#007bff",
  color: "#fff",
  border: "none",
  padding: "5px 10px"
}
