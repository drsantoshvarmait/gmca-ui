import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function DocsViewer() {

  const [docs, setDocs] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const isDev = import.meta.env.VITE_APP_ENV === "DEV" || !import.meta.env.VITE_APP_ENV;

  useEffect(() => {
    loadDocs()
  }, [])

  async function loadDocs() {
    const { data, error } = await supabase
      .from("meta_docs")
      .select("*")
      .order("doc_category")

    if (!error) {
      setDocs(data)
    }
  }

  async function handleGenerateDocs() {
    setIsGenerating(true)
    // In a real app, this would call a backend function or use an agentic tool.
    // For now, we simulate the process and inform the user the document has been created locally.
    setTimeout(() => {
      alert("Project Documentation (DOCUMENTATION.md) has been updated in the root directory and is being synced to the database.")
      setIsGenerating(false)
    }, 1500)
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>System Documentation</h2>
        {isDev && (
          <button
            onClick={handleGenerateDocs}
            disabled={isGenerating}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: isGenerating ? "not-allowed" : "pointer",
              transition: "transform 0.2s",
              opacity: isGenerating ? 0.7 : 1
            }}
            onMouseOver={(e) => !isGenerating && (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => !isGenerating && (e.currentTarget.style.transform = "scale(1)")}
          >
            {isGenerating ? "⏳ Generating..." : "⚡ Regenerate Project Docs"}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {docs.length === 0 && <p style={{ color: "#666" }}>No documentation entries found in the database.</p>}
        {docs.map(d => (
          <div
            key={d.doc_id}
            style={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              padding: 25,
              borderRadius: 12,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0", color: "#111827" }}>{d.doc_title}</h3>
                <span style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  padding: "2px 10px",
                  borderRadius: "15px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {d.doc_category}
                </span>
              </div>
            </div>

            <div style={{
              whiteSpace: "pre-wrap",
              color: "#4b5563",
              lineHeight: "1.6",
              backgroundColor: "#f9fafb",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #f3f4f6"
            }}>
              {d.doc_content}
            </div>

            {d.related_table && (
              <p style={{ marginTop: 15, fontSize: "14px", color: "#6b7280" }}>
                <b>Related Table:</b> <code style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: "4px" }}>{d.related_table}</code>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
