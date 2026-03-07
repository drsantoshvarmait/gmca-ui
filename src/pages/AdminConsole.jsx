import { useState } from "react"
import { adminModules } from "./admin/adminModules"

export default function AdminConsole() {

  const [tab, setTab] = useState(adminModules[0].id)

  const activeModule = adminModules.find(m => m.id === tab)

  const ActiveComponent = activeModule?.component

  return (
    <div style={{ padding: 20 }}>

      <h2>SGV Admin Console</h2>

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