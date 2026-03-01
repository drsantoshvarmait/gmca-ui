import { useState } from "react"
import SchemaView from "./admin/SchemaView"
import FunctionsView from "./admin/FunctionsView"
import TriggersView from "./admin/TriggersView"
import RLSView from "./admin/RLSView"
import RpcContractsView from "./admin/RpcContractsView"
import MetaDashboard from "./admin/MetaDashboard"

export default function AdminConsole() {
  const [tab, setTab] = useState("schema")

  return (
    <div style={{ padding: 20 }}>
      <h2>SGV Admin Console</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("schema")}>Schema</button>{" "}
        <button onClick={() => setTab("functions")}>Functions</button>{" "}
        <button onClick={() => setTab("triggers")}>Triggers</button>{" "}
        <button onClick={() => setTab("rls")}>RLS Policies</button>{" "}
        <button onClick={() => setTab("rpc")}>RPC Contracts</button>
        <button onClick={() => setTab("meta")}>Meta</button>
      </div>

      {tab === "schema" && <SchemaView />}
      {tab === "functions" && <FunctionsView />}
      {tab === "triggers" && <TriggersView />}
      {tab === "rls" && <RLSView />}
      {tab === "rpc" && <RpcContractsView />}
      {tab === "meta" && <MetaDashboard />}
    </div>
  )
}
