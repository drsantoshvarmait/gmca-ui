import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"
import { useNavigate } from "react-router-dom"
import { toast, Toaster } from "react-hot-toast"

export default function AdminWorkflows() {
  const [workflows, setWorkflows] = useState([])
  const [activeTab, setActiveTab] = useState("MINE") // "MINE" or "GLOBAL"
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleCreateNew() {
    const newName = prompt("Enter a name for the new workflow:")
    if (!newName) return
    const loadingToast = toast.loading("Creating workflow...")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const tenantId = user?.user_metadata?.tenant_id

      const { data, error } = await supabase
        .from("sop_workflow")
        .insert({
          workflow_name: newName,
          tenant_id: tenantId,
          status: 'DRAFT',
          scope: 'TENANT'
        })
        .select()
        .single()

      if (error) throw error
      toast.success("Workflow created!", { id: loadingToast })
      navigate(`/workflow-builder/${data.workflow_id}`)
    } catch (err) {
      toast.error("Creation failed: " + err.message, { id: loadingToast })
    }
  }

  async function loadWorkflows() {
    setLoading(true)
    try {
      const activeOrgId = localStorage.getItem("active_org_id")
      const { data: { user } } = await supabase.auth.getUser()
      const tenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id

      let query = supabase
        .from("sop_workflow")
        .select(`
          *,
            organisation_types:target_organisation_type_id (
              organisation_type
            )
        `)
        .order("created_at", { ascending: false })

      // Filter by the selected tab/scope
      if (activeTab === "MINE") {
        if (tenantId) {
          query = query.eq("tenant_id", tenantId).is("is_template", false)
        } else {
          query = query.is("tenant_id", null).is("is_template", false)
        }
      } else {
        // GLOBAL TEMPLATES TAB: Smart Inheritance
        // 1. Get current Org Type to show relevant templates
        let orgTypeId = null;
        if (activeOrgId) {
          const { data: orgData } = await supabase
            .from("organisations")
            .select("organisation_type_id")
            .eq("organisation_id", activeOrgId)
            .single();
          orgTypeId = orgData?.organisation_type_id;
        }

        // Logic: Show if it's GLOBAL (and matches type or is universal) OR if it belongs to this Tenant
        if (orgTypeId) {
          query = query.or(`scope.eq.GLOBAL,tenant_id.eq.${tenantId},target_organisation_type_id.eq.${orgTypeId}`)
        } else {
          query = query.or(`scope.eq.GLOBAL,tenant_id.eq.${tenantId}`)
        }
        query = query.eq("is_template", true)
      }

      const { data, error } = await query
      if (error) throw error
      setWorkflows(data || [])
    } catch (err) {
      toast.error("Failed to load workflows: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflows()
  }, [activeTab])

  async function handleClone(w) {
    const newName = prompt("Enter a name for your cloned workflow:", `${w.workflow_name} (Copy)`)

    if (!newName) return // User cancelled

    const loadingToast = toast.loading("Cloning workflow...")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const tenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id

      const { data, error } = await supabase.rpc("clone_workflow", {
        p_source_workflow_id: w.workflow_id,
        p_new_name: newName,
        p_new_scope: "TENANT",
        p_tenant_id: tenantId
      })

      if (error) throw error

      toast.success("Workflow cloned successfully!", { id: loadingToast })

      // If we are cloning a global template to our own, switch back to 'MINE' tab to see it
      if (activeTab === "GLOBAL") {
        setActiveTab("MINE")
      } else {
        loadWorkflows()
      }

    } catch (err) {
      toast.error("Clone failed: " + err.message, { id: loadingToast })
    }
  }

  return (
    <div style={containerStyle}>
      <Toaster position="top-right" />

      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, fontWeight: "700", color: "#1e293b" }}>Workflows</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
            Design, Manage, and Deploy Standard Operating Procedures.
          </p>
        </div>

        <button
          style={primaryBtnStyle}
          onClick={handleCreateNew}
        >
          + Create Workflow
        </button>
      </div>

      <div style={tabsContainer}>
        <div
          style={activeTab === "MINE" ? activeTabStyle : inactiveTabStyle}
          onClick={() => setActiveTab("MINE")}
        >
          My Workflows
        </div>
        <div
          style={activeTab === "GLOBAL" ? activeTabStyle : inactiveTabStyle}
          onClick={() => setActiveTab("GLOBAL")}
        >
          Global Templates
        </div>
      </div>

      <div style={contentStyle}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading {activeTab.toLowerCase()} workflows...</div>
        ) : workflows.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            No workflows found in this category.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Scope / Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map(w => (
                <tr key={w.workflow_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{w.workflow_name}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStyle,
                      background: w.scope === 'GLOBAL' ? '#ede9fe' : '#e0f2fe',
                      color: w.scope === 'GLOBAL' ? '#5b21b6' : '#0369a1'
                    }}>
                      {w.organisation_types?.organisation_type || w.scope || "TENANT"} {w.is_template ? " (Template)" : ""}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStyle,
                      background: w.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9',
                      color: w.status === 'PUBLISHED' ? '#166534' : '#475569'
                    }}>
                      {w.status || "DRAFT"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {/* Show Edit only if it belongs to the user OR it's a global template and we are in the GLOBAL tab (Admin usage) */}
                      {(activeTab === "MINE" || activeTab === "GLOBAL") && (
                        <button style={actionBtnStyle} onClick={() => navigate(`/workflow-builder/${w.workflow_id}`)}>Edit</button>
                      )}

                      {/* Everyone can clone templates OR their own workflows to create variations */}
                      <button
                        style={{ ...actionBtnStyle, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                        onClick={() => handleClone(w)}
                      >
                        Clone
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

// ----------------- STYLES -----------------
const containerStyle = {
  padding: "30px",
  maxWidth: "1200px",
  margin: "0 auto",
  fontFamily: "Inter, sans-serif"
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px"
}

const primaryBtnStyle = {
  background: "#2563eb",
  color: "white",
  padding: "10px 20px",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
}

const tabsContainer = {
  display: "flex",
  gap: "24px",
  borderBottom: "1px solid #e2e8f0",
  marginBottom: "20px"
}

const activeTabStyle = {
  padding: "10px 4px",
  fontWeight: "600",
  color: "#2563eb",
  borderBottom: "3px solid #2563eb",
  cursor: "pointer"
}

const inactiveTabStyle = {
  padding: "10px 4px",
  fontWeight: "600",
  color: "#64748b",
  borderBottom: "3px solid transparent",
  cursor: "pointer"
}

const contentStyle = {
  background: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  overflow: "hidden"
}

const thStyle = {
  padding: "16px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
}

const tdStyle = {
  padding: "16px",
  fontSize: "14px"
}

const badgeStyle = {
  padding: "4px 8px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "600",
  whiteSpace: "nowrap"
}

const actionBtnStyle = {
  background: "#f1f5f9",
  color: "#475569",
  border: "1px solid #cbd5e1",
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s"
}