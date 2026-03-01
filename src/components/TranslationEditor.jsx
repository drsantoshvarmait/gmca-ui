import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

const LANGUAGES = [
  { code: "mr", label: "Marathi" },
  { code: "hi", label: "Hindi" }
]

export default function TranslationEditor({
  entityType,
  entityId,
  fields,
  onClose
}) {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTranslations()
  }, [entityId])

  async function fetchTranslations() {
    const { data } = await supabase
      .from("entity_translations")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)

    const map = {}

    data?.forEach((row) => {
      if (!map[row.field_name]) {
        map[row.field_name] = {}
      }
      map[row.field_name][row.language_code] =
        row.translated_value
    })

    setValues(map)
  }

  function handleChange(fieldName, langCode, value) {
    setValues((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [langCode]: value
      }
    }))
  }

  async function handleSave() {
    setLoading(true)

    const upserts = []

    Object.keys(values).forEach((fieldName) => {
      Object.keys(values[fieldName]).forEach((langCode) => {
        upserts.push({
          entity_type: entityType,
          entity_id: entityId,
          field_name: fieldName,
          language_code: langCode,
          translated_value: values[fieldName][langCode]
        })
      })
    })

    await supabase
      .from("entity_translations")
      .upsert(upserts, {
        onConflict:
          "entity_type,entity_id,field_name,language_code"
      })

    setLoading(false)
    if (onClose) onClose()
  }

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <h3>Manage Translations</h3>

        {fields.map((field) => (
          <div key={field.name} style={{ marginBottom: 20 }}>
            <strong>{field.label}</strong>

            {LANGUAGES.map((lang) => (
              <div key={lang.code} style={{ marginTop: 8 }}>
                <label>{lang.label}</label>
                <input
                  type="text"
                  value={
                    values?.[field.name]?.[lang.code] || ""
                  }
                  onChange={(e) =>
                    handleChange(
                      field.name,
                      lang.code,
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>

          <button
            onClick={onClose}
            style={{ marginLeft: 10 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------ Styles ------------------ */

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
}

const modalBox = {
  background: "#fff",
  padding: 25,
  width: 400,
  borderRadius: 8
}

const inputStyle = {
  width: "100%",
  padding: 6,
  marginTop: 4
}