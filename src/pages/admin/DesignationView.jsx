import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"
import useEntityTranslations from "../../hooks/useEntityTranslations"
import TranslationEditor from "../../components/TranslationEditor"

export default function DesignationView() {
  const [designations, setDesignations] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  // ✅ Correct entity type
  const { getTranslation, loading } =
    useEntityTranslations("designations")

  useEffect(() => {
    fetchDesignations()
  }, [])

  async function fetchDesignations() {
    const { data, error } = await supabase
      .from("designations")   // ✅ Correct table
      .select("*")
      .order("designation_name")

    if (!error && data) {
      setDesignations(data)
    }
  }

  if (loading) return <p>Loading translations...</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>Designations</h2>

      <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Designation</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {designations.map((d) => (
            <tr key={d.designation_id}>
              <td>
                {getTranslation(
                  d.designation_id,          // ✅ Correct PK
                  "designation_name",        // ✅ Correct field
                  d.designation_name         // ✅ Correct fallback
                )}
              </td>

              <td>
                <button
                  onClick={() =>
                    setSelectedId(d.designation_id)
                  }
                >
                  🌐 Edit Translations
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Translation Modal */}
      {selectedId && (
        <TranslationEditor
          entityType="designations"          // ✅ Must match
          entityId={selectedId}
          fields={[
            {
              name: "designation_name",
              label: "Designation Name"
            }
          ]}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}