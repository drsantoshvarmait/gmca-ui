import { useState, useCallback, useEffect } from "react"
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges
} from "reactflow"
import "reactflow/dist/style.css"
import { supabase } from "../supabaseClient"
import { useParams, useNavigate } from "react-router-dom"
import { toast, Toaster } from "react-hot-toast"

export default function WorkflowBuilder() {
  const { id, contextCode } = useParams(); // gets workflow ID from URL
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [workflowName, setWorkflowName] = useState("Loading Workflow...");
  const [loading, setLoading] = useState(true);
  const [designations, setDesignations] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [workflowScope, setWorkflowScope] = useState("TENANT");

  // Load existing workflow and steps on mount
  useEffect(() => {
    async function loadWorkflowData() {
      if (!id) {
        setLoading(false);
        setWorkflowName("Invalid Workflow ID");
        return;
      }
      try {
        setLoading(true);
        // Load info
        const { data: wData, error: wErr } = await supabase
          .from("sop_workflow")
          .select("workflow_name, scope")
          .eq("workflow_id", id)
          .single();
        if (wErr) throw wErr;
        setWorkflowName(wData.workflow_name || "Untitled Workflow");
        setWorkflowScope(wData.scope || "TENANT");

        // Load steps
        const { data: sData, error: sErr } = await supabase
          .from("sop_step")
          .select("*")
          .eq("sop_id", id)
          .order("step_order", { ascending: true });

        if (sErr) throw sErr;

        if (sData && sData.length > 0) {
          const loadedNodes = sData.map((step, index) => ({
            id: step.sop_step_id,
            position: {
              x: step.position_x || 250,
              y: step.position_y || (index * 150 + 50)
            },
            data: {
              label: step.step_description,
              designation_id: step.designation_id
            }
          }));

          const loadedEdges = sData
            .filter(step => step.next_step_on_approve)
            .map(step => ({
              id: `e-${step.sop_step_id}-${step.next_step_on_approve}`,
              source: step.sop_step_id,
              target: step.next_step_on_approve
            }));

          setNodes(loadedNodes);
          setEdges(loadedEdges);
        }

        // Load Designations for Role-Based Assignment
        const { data: dData } = await supabase
          .from("designations")
          .select("designation_id, designation_name")
          .order("designation_name");
        setDesignations(dData || []);

      } catch (err) {
        toast.error("Failed to load workflow: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadWorkflowData();
  }, [id]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  function addStep() {
    const newId = crypto.randomUUID();
    const stepLabel = prompt("Enter Step Name:");

    if (!stepLabel) return;

    const newNode = {
      id: newId,
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: { label: stepLabel, designation_id: null }
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
  }

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  };

  function validateWorkflow() {
    // If no steps, it's just an empty workflow, we can save it.
    if (nodes.length === 0) return true;

    // find start nodes (no incoming edge)
    const startNodes = nodes.filter(node =>
      !edges.find(edge => edge.target === node.id)
    );

    if (startNodes.length === 0) {
      toast.error("Workflow has no clear logical start (all nodes have incoming edges).");
      return false;
    }

    if (startNodes.length > 1) {
      toast.error("Workflow must have exactly ONE starting step.");
      return false;
    }

    // check every node connected
    if (nodes.length > 1) {
      for (let node of nodes) {
        const hasIncoming = edges.find(e => e.target === node.id);
        const hasOutgoing = edges.find(e => e.source === node.id);
        if (!hasIncoming && !hasOutgoing) {
          toast.error("Step not connected: " + node.data.label);
          return false;
        }
      }
    }

    return true;
  }

  function detectLoop() {
    const visited = new Set();

    function dfs(nodeId) {
      if (visited.has(nodeId)) return true;
      visited.add(nodeId);
      const nextEdges = edges.filter(e => e.source === nodeId);
      for (let e of nextEdges) {
        if (dfs(e.target)) return true;
      }
      visited.delete(nodeId);
      return false;
    }

    for (let node of nodes) {
      if (dfs(node.id)) {
        toast.error("Workflow contains circular loop. Circular references are not allowed in SOPs.");
        return true;
      }
    }

    return false;
  }

  async function saveWorkflow() {
    if (!id) return;
    if (!validateWorkflow()) return;
    if (detectLoop()) return;

    const saveToast = toast.loading("Saving Workflow...");

    try {
      // 1. Get current tenant
      const { data: { user } } = await supabase.auth.getUser();
      const currentTenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id;

      // 2. Clear existing steps sequentially to rewrite
      await supabase.from("sop_step").delete().eq("sop_id", id);

      // 3. Batch insert with position and role data
      const insertData = nodes.map((node, i) => {
        const edge = edges.find(e => e.source === node.id);
        return {
          sop_step_id: node.id,
          sop_id: id,
          tenant_id: currentTenantId,
          step_order: i + 1,
          step_description: node.data.label,
          position_x: node.position.x,
          position_y: node.position.y,
          designation_id: node.data.designation_id || null,
          next_step_on_approve: edge ? edge.target : null
        };
      });

      if (insertData.length > 0) {
        const { error } = await supabase.from("sop_step").insert(insertData);
        if (error) throw error;
      }

      toast.success("Workflow saved successfully", { id: saveToast });

    } catch (err) {
      toast.error("Failed to save: " + err.message, { id: saveToast });
    }
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "'Inter', sans-serif"
    }}>
      <Toaster position="top-right" />

      {/* Header Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        backgroundColor: "white",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
      }}>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate(contextCode ? `/${contextCode}/admin-console` : "/superadmin-console")}
            style={{
              padding: "8px 12px",
              backgroundColor: "#f1f5f9",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              color: "#475569",
              cursor: "pointer"
            }}
          >
            ← Back
          </button>

          <div>
            <h1 style={{ margin: 0, fontSize: "18px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              SOP Builder: <span style={{ color: "#3b82f6" }}>{workflowName}</span>
              {workflowScope === 'GLOBAL' && (
                <span style={{
                  fontSize: "10px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  border: "1px solid #f87171"
                }}>GLOBAL MASTER</span>
              )}
            </h1>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              Drag nodes, connect edges to map out the standard operating procedure.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={addStep}
            style={{
              padding: "8px 16px",
              backgroundColor: "white",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontWeight: "600",
              color: "#334155",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            + Add Step
          </button>

          <button
            onClick={saveWorkflow}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
            }}
          >
            Save Graph
          </button>
        </div>

      </div>

      {/* Graph Area */}
      <div style={{ flex: 1, position: "relative", display: "flex" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%", color: "#64748b" }}>
            Loading existing graph...
          </div>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={() => setSelectedNodeId(null)}
                fitView
                style={{ backgroundColor: "#f8fafc" }}
              >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
              </ReactFlow>
            </div>

            {/* Property Panel */}
            {selectedNode && (
              <div style={{
                width: "300px",
                backgroundColor: "white",
                borderLeft: "1px solid #e2e8f0",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                boxShadow: "-4px 0 6px -1px rgba(0, 0, 0, 0.05)"
              }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b" }}>Step Properties</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Step Name</label>
                  <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Assigned Role</label>
                  <select
                    value={selectedNode.data.designation_id || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { designation_id: e.target.value || null })}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      backgroundColor: "white"
                    }}
                  >
                    <option value="">-- No Specific Role --</option>
                    {designations.map(d => (
                      <option key={d.designation_id} value={d.designation_id}>
                        {d.designation_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <button
                    onClick={() => {
                      setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                      setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                      setSelectedNodeId(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Delete Step
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}