import { useState } from "react"
import { adminModules } from "./admin/adminModules"

export default function AdminConsole() {

  const [tab, setTab] = useState(adminModules[0].id)

  const activeModule = adminModules.find(m => m.id === tab)

  const ActiveComponent = activeModule?.component

  return (
    <div style={{ padding: 20 }}>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>SGV Admin Console</h2>
        <span style={{
          backgroundColor: import.meta.env.VITE_APP_ENV === "PROD" ? "#ef4444" :
            import.meta.env.VITE_APP_ENV === "STAGING" ? "#f59e0b" : "#3b82f6",
          color: "white",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "bold",
          textTransform: "uppercase"
        }}>
          {import.meta.env.VITE_APP_ENV || "LOCAL"}
        </span>
      </div>

      <div style={{
        marginBottom: 20,
        display: "flex",
        flexWrap: "wrap",
        gap: 10
      }}>
        {adminModules.map(m => (
          <button key={m.id} onClick={() => setTab(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div>
        {ActiveComponent && (
          <ActiveComponent {...(activeModule?.props || {})} />
        )}
      </div>
    </div>
  )
}