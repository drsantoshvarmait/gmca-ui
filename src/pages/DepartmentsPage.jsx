import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import useEntityTranslations from "../hooks/useEntityTranslations"
import TranslationEditor from "../components/TranslationEditor"

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)

  const activeOrg = localStorage.getItem("active_org_id")

  const { getTranslation, loading } =
    useEntityTranslations("department_templates")

  useEffect(() => {
    fetchDepartments()
  }, [activeOrg])

  async function fetchDepartments() {
    if (!activeOrg) return

    const { data, error } = await supabase
      .from("departments")
      .select(`
        department_id,
        department_name,
        department_template_id
      `)
      .eq("organisation_id", activeOrg)
      .order("department_name")

    if (!error && data) {
      setDepartments(data)
    } else {
      console.error("Error loading departments:", error)
    }
  }

  if (loading) return <p>Loading translations...</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>Departments</h2>

      <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {departments.map((d) => (
            <tr key={d.department_id}>
              <td>
                {getTranslation(
                  d.department_template_id,
                  "department_name",
                  d.department_name
                )}
              </td>

              <td>
                <button
                  onClick={() =>
                    setSelectedTemplateId(d.department_template_id)
                  }
                >
                  🌐 Edit Translations
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedTemplateId && (
        <TranslationEditor
          entityType="department_templates"
          entityId={selectedTemplateId}
          fields={[
            {
              name: "department_name",
              label: "Department Name"
            }
          ]}
          onClose={() => setSelectedTemplateId(null)}
        />
      )}
    </div>
  )
}