import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import ReactFlow, { Background, Controls } from "reactflow"
import "reactflow/dist/style.css"

export default function WorkflowVisualizer({ sop_id }) {

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

  useEffect(() => {
    if (sop_id) {
      loadWorkflow()
    }
  }, [sop_id])

  async function loadWorkflow() {

    const { data, error } = await supabase
      .from("sop_step")
      .select("*")
      .eq("sop_id", sop_id)
      .order("step_order")

    if (error) {
      console.error("Workflow load error:", error)
      return
    }

    if (!data) return

    const nodes = data.map((step, i) => ({
      id: step.sop_step_id,
      data: { label: step.step_description },
      position: { x: 250, y: i * 120 },
      style: {
        padding: 10,
        border: "1px solid #333",
        borderRadius: 8,
        background: "#fff"
      }
    }))

    const edges = data
      .filter(step => step.next_step_on_approve)
      .map(step => ({
        id: step.sop_step_id + "_edge",
        source: step.sop_step_id,
        target: step.next_step_on_approve,
        type: "smoothstep",
        animated: true
      }))

    setNodes(nodes)
    setEdges(edges)
  }

  return (
    <div style={{ height: 600, border: "1px solid #ddd" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}