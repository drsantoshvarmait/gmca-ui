import { useState } from "react"
import ReactFlow, {
  addEdge,
  Background,
  Controls
} from "reactflow"
import "reactflow/dist/style.css"
import { supabase } from "../supabaseClient"

export default function WorkflowBuilder({ sop_id }) {

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

  function addStep() {

    const id = crypto.randomUUID()

    const newNode = {
      id,
      position: { x: 200, y: nodes.length * 120 },
      data: { label: "New Step" }
    }

    setNodes([...nodes, newNode])
  }

  function onConnect(params) {
    setEdges((eds) => addEdge(params, eds))
  }


    function validateWorkflow() {

        if (nodes.length === 0) {
            alert("Workflow has no steps")
            return false
        }

        // find start nodes (no incoming edge)
        const startNodes = nodes.filter(node =>
            !edges.find(edge => edge.target === node.id)
        )

        if (startNodes.length !== 1) {
            alert("Workflow must have exactly ONE start step")
            return false
        }

        // check every node connected
        for (let node of nodes) {

            const hasIncoming = edges.find(e => e.target === node.id)
            const hasOutgoing = edges.find(e => e.source === node.id)

            if (!hasIncoming && !hasOutgoing) {
            alert("Step not connected: " + node.data.label)
            return false
            }

        }

        return true
    }

    function detectLoop() {

        const visited = new Set()

        function dfs(nodeId) {

            if (visited.has(nodeId)) return true

            visited.add(nodeId)

            const nextEdges = edges.filter(e => e.source === nodeId)

            for (let e of nextEdges) {
            if (dfs(e.target)) return true
            }

            visited.delete(nodeId)

            return false
        }

        for (let node of nodes) {
            if (dfs(node.id)) {
            alert("Workflow contains circular loop")
            return true
            }
        }

        return false
    }

  async function saveWorkflow() {

    if (!validateWorkflow()) return
    if (detectLoop()) return

    for (let node of nodes) {

      const edge = edges.find(e => e.source === node.id)

      await supabase
        .from("sop_step")
        .insert({
          sop_step_id: node.id,
          sop_id: sop_id,
          step_order: nodes.indexOf(node) + 1,
          step_description: node.data.label,
          next_step_on_approve: edge ? edge.target : null
        })
    }

    alert("Workflow saved successfully")
  }

  return (

    <div>

      <div style={{ marginBottom: 10 }}>

        <button onClick={addStep}>Add Step</button>

        <button onClick={saveWorkflow}>
          Save Workflow
        </button>

      </div>

      <div style={{ height: 600 }}>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          fitView
        >

          <Background />
          <Controls />

        </ReactFlow>

      </div>

    </div>
  )
}