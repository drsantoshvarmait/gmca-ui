import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function DocsViewer() {

  const [docs, setDocs] = useState([])

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

  return (

    <div style={{ padding: 20 }}>

      <h2>System Documentation</h2>

      {docs.map(d => (

        <div
          key={d.doc_id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 15,
            borderRadius: 8
          }}
        >

          <h3>{d.doc_title}</h3>

          <small>{d.doc_category}</small>

          <p>{d.doc_content}</p>

          {d.related_table && (
            <p>
              <b>Related Table:</b> {d.related_table}
            </p>
          )}

        </div>

      ))}

    </div>

  )
}