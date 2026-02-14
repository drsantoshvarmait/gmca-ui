import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function SubmitLetter() {
  const [organisations, setOrganisations] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedOrg, setSelectedOrg] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [letterNumber, setLetterNumber] = useState("")
  const [letterContent, setLetterContent] = useState("")
  const [loading, setLoading] = useState(false)

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const letterId = searchParams.get("letter_id")

  useEffect(() => {
    fetchOrganisations()

    if (letterId) {
      loadDraft(letterId)
    }
  }, [])

  async function fetchOrganisations() {
    const { data } = await supabase
      .from("organisations")
      .select("organisation_id, organisation_name")
      .order("organisation_name")

    setOrganisations(data || [])
  }

  async function loadDraft(id) {
    const { data, error } = await supabase
      .from("letters")
      .select(`
        letter_id,
        letter_number,
        letter_content,
        organisation_id,
        status,
        letter_subjects ( subject_id )
      `)
      .eq("letter_id", id)
      .single()

    if (error) {
      console.error(error)
      return
    }

    setSelectedOrg(data.organisation_id)
    setLetterNumber(data.letter_number)
    setLetterContent(data.letter_content)

    const subjectIds =
      data.letter_subjects?.map(ls => ls.subject_id) || []

    setSelectedSubjects(subjectIds)

    loadSubjectsForOrg(data.organisation_id)
  }

  async function loadSubjectsForOrg(orgId) {
    const { data } = await supabase
      .from("comm_subject")
      .select("subject_id, subject_title")
      .eq("pending_with_org_id", orgId)
      .order("subject_title")

    setSubjects(data || [])
  }

  async function handleOrganisationChange(e) {
    const orgId = e.target.value
    setSelectedOrg(orgId)
    setSelectedSubjects([])
    loadSubjectsForOrg(orgId)
  }

  function handleSubjectSelect(e) {
    const values = Array.from(
      e.target.selectedOptions,
      option => option.value
    )
    setSelectedSubjects(values)
  }

  async function saveLetter(statusType) {
    const trimmedLetterNumber = letterNumber.trim()
    const trimmedContent = letterContent.trim()

    if (!selectedOrg || !trimmedLetterNumber || !trimmedContent) {
      alert("All fields required")
      return
    }

    setLoading(true)

    if (letterId) {
      // UPDATE EXISTING DRAFT
      const { error } = await supabase
        .from("letters")
        .update({
          letter_number: trimmedLetterNumber,
          letter_content: trimmedContent,
          status: statusType
        })
        .eq("letter_id", letterId)

      if (!error) {
        alert(`Letter ${statusType} successfully ✔`)
        navigate("/outbox")
      }
    } else {
      // INSERT NEW
      const { error } = await supabase.rpc(
        "create_letter_with_subjects",
        {
          p_organisation_id: selectedOrg,
          p_subject_ids: selectedSubjects,
          p_letter_number: trimmedLetterNumber,
          p_letter_content: trimmedContent,
          p_status: statusType
        }
      )

      if (!error) {
        alert(`Letter ${statusType} successfully ✔`)
        navigate("/outbox")
      }
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: "auto" }}>
      <h2>{letterId ? "Edit Draft" : "Submit Letter"}</h2>

      <div style={{ marginBottom: 20 }}>
        <label>To Organisation</label>
        <select
          value={selectedOrg}
          onChange={handleOrganisationChange}
          style={{ width: "100%", padding: 8 }}
        >
          <option value="">-- Select Organisation --</option>
          {organisations.map(org => (
            <option
              key={org.organisation_id}
              value={org.organisation_id}
            >
              {org.organisation_name}
            </option>
          ))}
        </select>
      </div>

      {subjects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label>Select Subject(s)</label>
          <select
            multiple
            value={selectedSubjects}
            onChange={handleSubjectSelect}
            style={{ width: "100%", padding: 8, height: 150 }}
          >
            {subjects.map(sub => (
              <option
                key={sub.subject_id}
                value={sub.subject_id}
              >
                {sub.subject_title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label>Letter Number</label>
        <input
          type="text"
          value={letterNumber}
          onChange={(e) => setLetterNumber(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Letter Content</label>
        <textarea
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => saveLetter("Draft")}
          disabled={loading}
          style={btnGray}
        >
          {loading ? "Saving..." : "Save Draft"}
        </button>

        <button
          onClick={() => saveLetter("Submitted")}
          disabled={loading}
          style={btnBlue}
        >
          {loading ? "Submitting..." : "Final Submit"}
        </button>
      </div>
    </div>
  )
}

const btnGray = {
  padding: "10px 20px",
  background: "#6c757d",
  color: "#fff",
  border: "none"
}

const btnBlue = {
  padding: "10px 20px",
  background: "#007bff",
  color: "#fff",
  border: "none"
}
