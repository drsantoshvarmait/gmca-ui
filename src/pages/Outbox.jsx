import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function Outbox() {
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLetters()
  }, [])

  async function fetchLetters() {
    setLoading(true)

    const { data, error } = await supabase
      .from("letters")
      .select(`
        letter_id,
        letter_number,
        created_at,
        status,
        organisations ( organisation_name ),
        letter_subjects (
          comm_subject ( subject_title )
        )
      `)
      .order("created_at", { ascending: false })

    setLoading(false)

    if (error) {
      console.error(error)
      return
    }

    setLetters(data || [])
  }

  async function deleteDraft(letterId) {
    if (!window.confirm("Delete this draft?")) return

    const { error } = await supabase
      .from("letters")
      .delete()
      .eq("letter_id", letterId)

    if (!error) fetchLetters()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ maxWidth: 1200, margin: "auto" }}>
      <h2>Outbox / Sent Register</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f2f2f2" }}>
            <th style={th}>Letter No</th>
            <th style={th}>Organisation</th>
            <th style={th}>Subjects</th>
            <th style={th}>Date</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {letters.map(letter => {
            const subjectList =
              letter.letter_subjects
                ?.map(ls => ls.comm_subject?.subject_title)
                .filter(Boolean)
                .join(", ") || "-"

            return (
              <tr key={letter.letter_id}>
                <td style={td}>{letter.letter_number}</td>
                <td style={td}>
                  {letter.organisations?.organisation_name}
                </td>
                <td style={td}>{subjectList}</td>
                <td style={td}>
                  {new Date(letter.created_at).toLocaleDateString()}
                </td>
                <td style={td}>{letter.status}</td>

                <td style={td}>
                  {letter.status === "Draft" ? (
                    <>
                      <button
                        onClick={() =>
                          navigate(`/submit-letter?letter_id=${letter.letter_id}`)
                        }
                        style={btnBlue}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteDraft(letter.letter_id)}
                        style={btnRed}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span style={{ color: "green" }}>Locked</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* Styling */
const th = { padding: "10px", border: "1px solid #ddd", textAlign: "left" }
const td = { padding: "8px", border: "1px solid #ddd" }

const btnBlue = {
  background: "#007bff",
  color: "#fff",
  border: "none",
  padding: "5px 10px",
  marginRight: 5
}

const btnRed = {
  background: "#dc3545",
  color: "#fff",
  border: "none",
  padding: "5px 10px"
}
