import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useLanguage } from "../context/LanguageContext"
import { callAIGateway } from "../utils/api"
import NotificationBell from "../components/NotificationBell"
import { Toaster, toast } from "react-hot-toast"

export default function Dashboard() {
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguage()
  const [stats, setStats] = useState({
    totalSubjects: 0,
    draftLetters: 0,
    submittedLetters: 0,
    pendingSubjects: 0
  })
  const [workflowStats, setWorkflowStats] = useState({
    activeTasks: 0,
    completedTasks: 0,
    slaAlerts: 0
  })
  const [userProfile, setUserProfile] = useState(null)
  const [loadingContext, setLoadingContext] = useState(true)
  const [orgList, setOrgList] = useState([])
  const [activeOrgId, setActiveOrgId] = useState("")
  const [activeOrgData, setActiveOrgData] = useState(null)
  const [tenantData, setTenantData] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const env = import.meta.env.VITE_APP_ENV || "LOCAL";

  useEffect(() => {
    async function init() {
      await fetchUserSession()
      await loadOrganisations()
      setLoadingContext(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (activeOrgId) {
      fetchStats()
      fetchWorkflowStats()
      const org = orgList.find(o => o.organisation_id === activeOrgId)
      if (org) {
        setActiveOrgData(org.organisations)
        if (org.organisations.tenant_id) {
          fetchTenantBranding(org.organisations.tenant_id)
        }
      }
    }
  }, [activeOrgId, orgList])

  async function fetchUserSession() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      setUserProfile(profile)
    }
  }

  async function loadOrganisations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("user_org_roles")
      .select(`
        organisation_id,
        role,
        organisations (
          organisation_name,
          organisation_code,
          tenant_id
        )
      `)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching organisations:", error)
      return
    }

    if (data && data.length > 0) {
      setOrgList(data)
      const storedActive = localStorage.getItem("active_org_id")
      const initialOrg = storedActive && data.find(o => o.organisation_id === storedActive)
        ? storedActive
        : data[0].organisation_id
      
      setActiveOrgId(initialOrg)
    }
  }

  async function fetchTenantBranding(tenantId) {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()
    
    if (data) {
      setTenantData(data)
    }
  }

  async function fetchStats() {
    const { count: subjectCount } = await supabase
      .from("comm_subject")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", activeOrgId)
    
    const { count: draftCount } = await supabase
      .from("letters")
      .select("*", { count: "exact", head: true })
      .eq("status", "Draft")
      .eq("organisation_id", activeOrgId)
    
    const { count: submittedCount } = await supabase
      .from("letters")
      .select("*", { count: "exact", head: true })
      .eq("status", "Submitted")
      .eq("organisation_id", activeOrgId)
    
    const { count: pendingCount } = await supabase
      .from("comm_subject")
      .select("*", { count: "exact", head: true })
      .eq("subject_status", "Pending")
      .eq("organisation_id", activeOrgId)

    setStats({
      totalSubjects: subjectCount || 0,
      draftLetters: draftCount || 0,
      submittedLetters: submittedCount || 0,
      pendingSubjects: pendingCount || 0
    })
  }

  async function fetchWorkflowStats() {
    try {
      const { data, error } = await supabase
        .from("v_workflow_health_dashboard")
        .select("*")
      if (error) throw error
      if (data && data.length > 0) {
        const row = data[0]
        setWorkflowStats({
          activeTasks: row.tasks_in_progress || 0,
          completedTasks: row.tasks_completed || 0,
          slaAlerts: row.possible_sla_breach || 0
        })
      }
    } catch (err) {
      console.error("Workflow stats error:", err.message)
    }
  }

  async function testAI() {
    try {
      setAiLoading(true)
      const result = await callAIGateway("Test authentication from dashboard", supabase)
      console.log(result)
      toast.success("AI Gateway Synchronized")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    localStorage.removeItem("user_orgs")
    localStorage.removeItem("active_org_id")
    navigate("/login")
  }

  async function changeLanguage(newLang) {
    setLanguage(newLang)
    if (userProfile) {
      await supabase
        .from("profiles")
        .update({ preferred_language_code: newLang })
        .eq("id", userProfile.id)
      toast.success(`Language changed to ${newLang === 'en' ? 'English' : newLang === 'mr' ? 'Marathi' : 'Hindi'}`)
    }
  }

  function handleOrgChange(newOrgId) {
    localStorage.setItem("active_org_id", newOrgId)
    setActiveOrgId(newOrgId)
  }

  const brandColor = tenantData?.settings?.brand_color || "#3b82f6";
  const glassEffect = {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)"
  };

  if (loadingContext) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: "#f8fafc" }}>
        <h2 style={{ fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>INITIALIZING ECOSYSTEM...</h2>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      
      {/* Background Floaters */}
      <div style={floater1}></div>
      <div style={floater2}></div>

      {/* Top Header */}
      <div style={{ ...glassEffect, ...navBar }}>
        <div style={navBrand}>
          <div style={{ ...logoBadge, backgroundColor: brandColor }}>
            {tenantData?.tenant_code?.substring(0, 2) || "GS"}
          </div>
          <div>
            <h2 style={navTitle}>{tenantData?.tenant_name || "Governance System"}</h2>
            <div style={envTagBox}>
               <span style={{ ...envTag, backgroundColor: env === 'PROD' ? '#ef4444' : env === 'STAGING' ? '#f59e0b' : '#3b82f6' }}>{env}</span>
               <span style={orgSubTitle}>{activeOrgData?.organisation_name || "Detecting Node..."}</span>
            </div>
          </div>
        </div>

        <div style={navActions}>
          <div style={actionGroup}>
             <NotificationBell />
             <div style={divider}></div>
             <select
                value={activeOrgId}
                onChange={(e) => handleOrgChange(e.target.value)}
                style={selectInput}
              >
                {orgList.map(org => (
                  <option key={org.organisation_id} value={org.organisation_id}>
                    {org.organisations?.organisation_name}
                  </option>
                ))}
              </select>
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={selectInput}
              >
                <option value="en">EN</option>
                <option value="mr">MR</option>
                <option value="hi">HI</option>
              </select>
          </div>
          <button onClick={logout} style={logoutButton}>Logout</button>
        </div>
      </div>

      <div style={contentGrid}>
        {/* Profile Card */}
        <div style={{ ...glassEffect, ...profileCard }}>
          <div style={profileTop}>
             <div style={avatar}>{userProfile?.email?.[0].toUpperCase()}</div>
             <div style={profileInfo}>
                <h3 style={profileName}>{userProfile?.email}</h3>
                <p style={profileRole}>{userProfile?.role || "Unit Officer"} • {activeOrgData?.organisation_code}</p>
             </div>
          </div>
          <div style={quickStats}>
             <div style={statItem}>
                <span style={statLabel}>Current Jurisdiction</span>
                <span style={statValue}>{tenantData?.tenant_code || "SYSTEM"}</span>
             </div>
          </div>
        </div>

        {/* Dashboard Sections */}
        <main style={mainContent}>
          <section>
            <h3 style={sectionHeading}>Communication Overview</h3>
            <div style={statsGrid}>
              <StatCard title="Total Subjects" value={stats.totalSubjects} color="#3b82f6" />
              <StatCard title="Pending" value={stats.pendingSubjects} color="#f59e0b" />
              <StatCard title="Drafts" value={stats.draftLetters} color="#64748b" />
              <StatCard title="Submitted" value={stats.submittedLetters} color="#10b981" />
            </div>
          </section>

          <section style={{ marginTop: "40px" }}>
            <h3 style={sectionHeading}>Workflow Pulse</h3>
            <div style={statsGrid}>
              <StatCard title="Active Tasks" value={workflowStats.activeTasks} color="#8b5cf6" />
              <StatCard title="Completed" value={workflowStats.completedTasks} color="#06b6d4" />
              <StatCard title="SLA Alerts" value={workflowStats.slaAlerts} color="#ef4444" isAlert={workflowStats.slaAlerts > 0} />
            </div>
          </section>

          <section style={{ marginTop: "40px" }}>
            <h3 style={sectionHeading}>Priority Operations</h3>
            <div style={operationsGrid}>
               <OpButton icon="➕" label="Draft Letter" onClick={() => navigate("/submit-letter")} />
               <OpButton icon="📥" label="Workflow Inbox" onClick={() => navigate("/workflow-inbox")} color="#8b5cf6" />
               <OpButton icon="📁" label="Subject Explorer" onClick={() => navigate("/communications")} />
               <OpButton icon="🏛" label="Org Directory" onClick={() => navigate("/departments")} />
               <OpButton icon="⚙" label="Admin Console" onClick={() => navigate("/admin-console")} color="#1e293b" />
               <OpButton icon="🛒" label="Procurement" onClick={() => navigate("/procurement")} color="#06b6d4" />
               <OpButton icon="💰" label="Finance" onClick={() => navigate("/finance")} color="#10b981" />
               <OpButton icon="📤" label="Outbox" onClick={() => navigate("/outbox")} />
               <OpButton icon="🧠" label={aiLoading ? "Thinking..." : "AI Gateway"} onClick={testAI} color="#ec4899" />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function StatCard({ title, value, color, isAlert }) {
  return (
    <div style={{ 
      background: "white", 
      padding: "24px", 
      borderRadius: "20px", 
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
      borderLeft: `6px solid ${color}`,
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }}>
      <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>
      <h2 style={{ fontSize: "32px", fontWeight: "800", color: isAlert ? "#ef4444" : "#1e293b", margin: 0 }}>{value}</h2>
    </div>
  )
}

function OpButton({ icon, label, onClick, color = "#3b82f6" }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 20px",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        cursor: "pointer",
        transition: "all 0.2s",
        fontSize: "15px",
        fontWeight: "700",
        color: "#1e293b",
        textAlign: "left",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      <span style={{ fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: `${color}10`, borderRadius: "10px", color: color }}>{icon}</span>
      {label}
    </button>
  )
}

// Styles
const pageContainer = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "100px 40px 40px",
  fontFamily: "'Inter', sans-serif",
  position: "relative",
  overflow: "hidden"
}

const navBar = {
  position: "fixed",
  top: "20px",
  left: "40px",
  right: "40px",
  padding: "12px 24px",
  borderRadius: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 1000
}

const navBrand = { display: "flex", alignItems: "center", gap: "16px" }
const logoBadge = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontWeight: "900",
  fontSize: "18px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
}

const navTitle = { margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b", letterSpacing: "-0.5px" }
const envTagBox = { display: "flex", alignItems: "center", gap: "8px" }
const envTag = { padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase" }
const orgSubTitle = { fontSize: "13px", fontWeight: "600", color: "#64748b" }

const navActions = { display: "flex", alignItems: "center", gap: "24px" }
const actionGroup = { display: "flex", alignItems: "center", gap: "12px" }
const divider = { width: "1px", height: "30px", background: "#e2e8f0" }
const selectInput = { padding: "8px 12px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", fontSize: "13px", fontWeight: "600", color: "#1e293b", outline: "none", cursor: "pointer" }
const logoutButton = { padding: "8px 20px", borderRadius: "12px", border: "none", background: "#fee2e2", color: "#991b1b", fontWeight: "700", fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }

const contentGrid = { display: "grid", gridTemplateColumns: "320px 1fr", gap: "40px", position: "relative", zIndex: 10 }

const profileCard = { padding: "32px", borderRadius: "24px", height: "fit-content" }
const profileTop = { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "32px" }
const avatar = { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", color: "white", fontSize: "32px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }
const profileName = { margin: 0, fontSize: "20px", fontWeight: "800", color: "#1e293b", wordBreak: "break-all" }
const profileRole = { margin: "8px 0 0", fontSize: "14px", fontWeight: "600", color: "#64748b" }
const quickStats = { borderTop: "1px solid #f1f5f9", paddingTop: "24px" }
const statItem = { display: "flex", flexDirection: "column", gap: "4px" }
const statLabel = { fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }
const statValue = { fontSize: "16px", fontWeight: "800", color: "#1e293b" }

const mainContent = { display: "flex", flexDirection: "column", gap: "0" }
const sectionHeading = { fontSize: "20px", fontWeight: "800", color: "#1e293b", marginBottom: "20px", letterSpacing: "-0.5px" }
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }
const operationsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }

const floater1 = { position: "absolute", top: "10%", left: "-5%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0) 70%)", borderRadius: "50%", zIndex: 1 }
const floater2 = { position: "absolute", bottom: "10%", right: "-5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0) 70%)", borderRadius: "50%", zIndex: 1 }