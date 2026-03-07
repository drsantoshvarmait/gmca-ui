export default function StepEditor({ node, updateNode }) {

  if (!node) return <div>Select a step</div>

  return (

    <div style={{ padding: 20 }}>

      <h3>Edit Step</h3>

      <label>Description</label>
      <input
        value={node.data.label}
        onChange={(e) =>
          updateNode(node.id, { label: e.target.value })
        }
      />

      <br /><br />

      <label>SLA Hours</label>
      <input
        type="number"
        value={node.data.sla_hours || ""}
        onChange={(e) =>
          updateNode(node.id, { sla_hours: e.target.value })
        }
      />

    </div>
  )
}