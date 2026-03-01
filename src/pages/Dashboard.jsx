import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useLanguage } from "../context/LanguageContext"
import { callAIGateway } from "../utils/api"

export default function Dashboard() {
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguage()

  const [stats, setStats] = useState({
    totalSubjects: 0,
    draftLetters: 0,
    submittedLetters: 0,
    pendingSubjects: 0
  })

  const [userEmail, setUserEmail] = useState("")
  const [loadingLang, setLoadingLang] = useState(false)

  const [orgList, setOrgList] = useState([])
  const [activeOrg, setActiveOrg] = useState("")

  const [aiLoading, setAiLoading] = useState(false)

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    fetchUser()
    loadOrganisations()
  }, [])

  useEffect(() => {
    if (activeOrg) {
      fetchStats()
    }
  }, [activeOrg])

  /* =========================
     FETCH USER
  ========================= */
  async function fetchUser() {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error

      setUserEmail(data?.user?.email || "")
    } catch (err) {
      console.error("Fetch user error:", err.message)
    }
  }

  /* =========================
     LOAD ORGANISATIONS
  ========================= */
  function loadOrganisations() {
    const storedOrgs = JSON.parse(localStorage.getItem("user_orgs") || "[]")
    const storedActive = localStorage.getItem("active_org_id")

    setOrgList(storedOrgs)
    setActiveOrg(storedActive || storedOrgs?.[0]?.organisation_id || "")
  }

  /* =========================
     FETCH STATS
  ========================= */
  async function fetchStats() {
    if (!activeOrg) return

    try {
      const { count: subjectCount } = await supabase
        .from("comm_subject")
        .select("*", { count: "exact", head: true })
        .eq("organisation_id", activeOrg)

      const { count: draftCount } = await supabase
        .from("letters")
        .select("*", { count: "exact", head: true })
        .eq("status", "Draft")
        .eq("organisation_id", activeOrg)

      const { count: submittedCount } = await supabase
        .from("letters")
        .select("*", { count: "exact", head: true })
        .eq("status", "Submitted")
        .eq("organisation_id", activeOrg)

      const { count: pendingCount } = await supabase
        .from("comm_subject")
        .select("*", { count: "exact", head: true })
        .eq("subject_status", "Pending")
        .eq("organisation_id", activeOrg)

      setStats({
        totalSubjects: subjectCount || 0,
        draftLetters: draftCount || 0,
        submittedLetters: submittedCount || 0,
        pendingSubjects: pendingCount || 0
      })

    } catch (err) {
      console.error("Fetch stats error:", err.message)
    }
  }

  /* =========================
     LOGOUT
  ========================= */
  async function logout() {
    await supabase.auth.signOut()
    localStorage.removeItem("user_orgs")
    localStorage.removeItem("active_org_id")
    navigate("/login")
  }

  /* =========================
     CHANGE LANGUAGE
  ========================= */
  async function changeLanguage(newLang) {
    try {
      setLoadingLang(true)
      setLanguage(newLang)

      const { data: userData } = await supabase.auth.getUser()

      if (userData?.user?.id) {
        await supabase
          .from("profiles")
          .update({ preferred_language_code: newLang })
          .eq("id", userData.user.id)
      }
    } catch (err) {
      console.error("Language update failed:", err.message)
    } finally {
      setLoadingLang(false)
    }
  }

  /* =========================
     CHANGE ORGANISATION
  ========================= */
  function handleOrgChange(newOrgId) {
    localStorage.setItem("active_org_id", newOrgId)
    setActiveOrg(newOrgId)
    window.location.reload()
  }

  /* =========================
     AI TEST
  ========================= */
  async function testAI() {
    try {
      setAiLoading(true)

      const result = await callAIGateway(
        "Test authentication from dashboard",
        supabase
      )

      console.log("AI Result:", result)
      alert("AI Success — Check console")

    } catch (err) {
      console.error("AI Error:", err.message)
      alert("AI Error: " + err.message)
    } finally {
      setAiLoading(false)
    }
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div style={container}>
      <div style={header}>
        <div>
          <h2>GMCA Communication Dashboard</h2>
          <p style={{ color: "#666" }}>Welcome, {userEmail}</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={activeOrg}
            onChange={(e) => handleOrgChange(e.target.value)}
            style={orgSelect}
          >
            {orgList.map(org => (
              <option
                key={org.organisation_id}
                value={org.organisation_id}
              >
                {org.organisations?.organisation_name || "Organisation"}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={langSelect}
            disabled={loadingLang}
          >
            <option value="en">English</option>
            <option value="mr">Marathi</option>
            <option value="hi">Hindi</option>
          </select>

          <button onClick={logout} style={logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={cardGrid}>
        <Card title="Total Subjects" value={stats.totalSubjects} />
        <Card title="Pending Subjects" value={stats.pendingSubjects} />
        <Card title="Draft Letters" value={stats.draftLetters} />
        <Card title="Submitted Letters" value={stats.submittedLetters} />
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>Quick Actions</h3>

        <div style={actionGrid}>
          <ActionButton label="➕ Create New Letter" onClick={() => navigate("/submit-letter")} />
          <ActionButton label="📤 View Outbox" onClick={() => navigate("/outbox")} />
          <ActionButton label="📁 View Subjects" onClick={() => navigate("/communications")} />
          <ActionButton label="⚙ Admin Console" onClick={() => navigate("/admin-console")} />
          <ActionButton label="🏛 View Departments" onClick={() => navigate("/departments")} />

          <button
            onClick={testAI}
            style={aiBtn}
            disabled={aiLoading}
          >
            {aiLoading ? "Testing AI..." : "🧠 Test AI Gateway"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================
   UI COMPONENTS
========================= */

function Card({ title, value }) {
  return (
    <div style={card}>
      <h4 style={{ marginBottom: 10 }}>{title}</h4>
      <h2>{value}</h2>
    </div>
  )
}

function ActionButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={actionBtn}>
      {label}
    </button>
  )
}

/* =========================
   STYLES
========================= */

const container = { maxWidth: 1200, margin: "auto", padding: 30 }
const header = { display: "flex", justifyContent: "space-between", alignItems: "center" }
const orgSelect = { padding: "6px 10px", borderRadius: 4 }
const langSelect = { padding: "6px 10px", borderRadius: 4 }
const logoutBtn = { background: "#dc3545", color: "#fff", border: "none", padding: "8px 15px", cursor: "pointer" }
const cardGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginTop: 30 }
const card = { padding: 20, background: "#f8f9fa", borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }
const actionGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginTop: 20 }
const actionBtn = { padding: 15, background: "#007bff", color: "#fff", border: "none", cursor: "pointer", borderRadius: 6 }
const aiBtn = { padding: 15, background: "#28a745", color: "#fff", border: "none", cursor: "pointer", borderRadius: 6 }