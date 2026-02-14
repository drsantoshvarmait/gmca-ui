import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function Dashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalSubjects: 0,
    draftLetters: 0,
    submittedLetters: 0,
    pendingSubjects: 0
  })

  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    fetchStats()
    fetchUser()
  }, [])

  async function fetchUser() {
    const { data } = await supabase.auth.getUser()
    setUserEmail(data?.user?.email || "")
  }

  async function fetchStats() {
    const { count: subjectCount } = await supabase
      .from("comm_subject")
      .select("*", { count: "exact", head: true })

    const { count: draftCount } = await supabase
      .from("letters")
      .select("*", { count: "exact", head: true })
      .eq("status", "Draft")

    const { count: submittedCount } = await supabase
      .from("letters")
      .select("*", { count: "exact", head: true })
      .eq("status", "Submitted")

    const { count: pendingCount } = await supabase
      .from("comm_subject")
      .select("*", { count: "exact", head: true })
      .eq("subject_status", "Pending")

    setStats({
      totalSubjects: subjectCount || 0,
      draftLetters: draftCount || 0,
      submittedLetters: submittedCount || 0,
      pendingSubjects: pendingCount || 0
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate("/login")
  }

  return (
    <div style={container}>
      {/* Header */}
      <div style={header}>
        <div>
          <h2>GMCA Communication Dashboard</h2>
          <p style={{ color: "#666" }}>Welcome, {userEmail}</p>
        </div>

        <button onClick={logout} style={logoutBtn}>
          Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div style={cardGrid}>
        <Card title="Total Subjects" value={stats.totalSubjects} />
        <Card title="Pending Subjects" value={stats.pendingSubjects} />
        <Card title="Draft Letters" value={stats.draftLetters} />
        <Card title="Submitted Letters" value={stats.submittedLetters} />
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 40 }}>
        <h3>Quick Actions</h3>

        <div style={actionGrid}>
          <ActionButton
            label="➕ Create New Letter"
            onClick={() => navigate("/submit-letter")}
          />

          <ActionButton
            label="📤 View Outbox"
            onClick={() => navigate("/outbox")}
          />

          <ActionButton
            label="📁 View Subjects"
            onClick={() => navigate("/communications")}
          />

          <ActionButton
            label="⚙ Admin Console"
            onClick={() => navigate("/admin-console")}
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------- UI Components ------------------- */

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

/* ------------------- Styles ------------------- */

const container = {
  maxWidth: 1200,
  margin: "auto",
  padding: 30
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}

const logoutBtn = {
  background: "#dc3545",
  color: "#fff",
  border: "none",
  padding: "8px 15px",
  cursor: "pointer"
}

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 20,
  marginTop: 30
}

const card = {
  padding: 20,
  background: "#f8f9fa",
  borderRadius: 8,
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
}

const actionGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 20,
  marginTop: 20
}

const actionBtn = {
  padding: 15,
  background: "#007bff",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  borderRadius: 6
}
