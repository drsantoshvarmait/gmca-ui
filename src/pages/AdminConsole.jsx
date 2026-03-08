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

        {import.meta.env.VITE_APP_ENV === "DEV" && (
          <button
            onClick={() => window.open(import.meta.env.VITE_STAGING_URL || "https://gmca-ui-staging.vercel.app/", "_blank")}
            style={{
              marginLeft: "auto",
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            🚀 Promote to STAGING
          </button>
        )}

        {import.meta.env.VITE_APP_ENV === "STAGING" && (
          <button
            onClick={() => window.open(import.meta.env.VITE_PROD_URL || "https://gmca-ui.vercel.app/", "_blank")}
            style={{
              marginLeft: "auto",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            🌟 Promote to PRODUCTION
          </button>
        )}
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