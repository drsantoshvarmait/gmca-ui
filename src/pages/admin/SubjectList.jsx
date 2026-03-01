import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"
import useEntityTranslations from "../../hooks/useEntityTranslations"

export default function SubjectList() {
  const [subjects, setSubjects] = useState([])

  const { getTranslation, loading } =
    useEntityTranslations("subjects")

  useEffect(() => {
    async function fetchSubjects() {
      const { data } = await supabase
        .from("subjects")
        .select("*")
        .order("subject")

      setSubjects(data || [])
    }

    fetchSubjects()
  }, [])

  if (loading) return <p>Loading translations...</p>

  return (
    <div>
      <h2>Subjects</h2>
      {subjects.map(s => (
        <div key={s.subject_id}>
          {getTranslation(
            s.subject_id,
            "subject",
            s.subject
          )}
        </div>
      ))}
    </div>
  )
}