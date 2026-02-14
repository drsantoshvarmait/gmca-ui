import { useState } from "react"
import { useError } from "../context/ErrorContext"

export default function ErrorPanel() {
  const { errors, clearErrors } = useError()
  const [open, setOpen] = useState(false)

  if (!errors.length) return null

  return (
    <div style={panelStyle}>
      <button onClick={() => setOpen(!open)} style={toggleBtn}>
        🧠 Errors ({errors.length})
      </button>

      {open && (
        <div style={bodyStyle}>
          <button onClick={clearErrors} style={clearBtn}>
            Clear
          </button>

          {errors.map(e => (
            <div key={e.id} style={errorItem}>
              <strong>{e.time}</strong>
              <div>{e.message}</div>
              {e.code && <small>Code: {e.code}</small>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const panelStyle = {
  position: "fixed",
  bottom: 10,
  right: 10,
  zIndex: 9999
}

const toggleBtn = {
  padding: "8px 12px",
  background: "#222",
  color: "#fff",
  borderRadius: "6px",
  border: "none"
}

const bodyStyle = {
  background: "#fff",
  width: "320px",
  maxHeight: "400px",
  overflowY: "auto",
  boxShadow: "0 0 10px rgba(0,0,0,0.3)",
  padding: "10px",
  marginTop: "5px",
  borderRadius: "6px"
}

const errorItem = {
  background: "#ffe6e6",
  padding: "8px",
  marginBottom: "8px",
  borderRadius: "4px"
}

const clearBtn = {
  marginBottom: "10px"
}
