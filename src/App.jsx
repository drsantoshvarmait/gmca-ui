import { Routes, Route, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

import Login from "./pages/Login"
import SubmitLetter from "./pages/SubmitLetter"
import Communications from "./pages/Communications"
import CommunicationDetails from "./pages/CommunicationDetails"
import AdminConsole from "./pages/AdminConsole"
import Outbox from "./pages/Outbox"        // ✅ IMPORTANT
import ErrorPanel from "./components/ErrorPanel"
import SubjectChronology from "./pages/SubjectChronology"
import ProtectedRoute from "./components/ProtectedRoute"
import Dashboard from "./pages/Dashboard"
import Signup from "./pages/Signup"




function Home() {
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    fetchSubjects()
    checkUser()
  }, [])

  async function checkUser() {
    const { data, error } = await supabase.auth.getUser()
    console.log("AUTH USER:", data)
    console.log("AUTH ERROR:", error)
  }

  async function fetchSubjects() {
    const { data, error } = await supabase
      .from("comm_subject")
      .select("*")
      .order("subject_reference_no")

    if (!error && data) {
      setSubjects(data)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>GMCA Dashboard</h2>

      <Link to="/submit-letter">
        <button style={{ marginBottom: 10 }}>Submit Letter</button>
      </Link>

      <br />

      <Link to="/outbox">
        <button style={{ marginBottom: 10 }}>Outbox</button>
      </Link>

      <br />

      <Link to="/communications">
        <button style={{ marginBottom: 20 }}>
          View Communications
        </button>
      </Link>

      <hr />

      <h2>Subject List</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Title</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.subject_id}>
              <td>{subject.subject_reference_no}</td>
              <td>
                <Link to={`/subject/${subject.subject_id}`}>
                  {subject.subject_title}
                </Link>
              </td>
              <td>{subject.subject_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function App() {
  useEffect(() => {
    window.supabase = supabase
    console.log("Supabase exposed globally for debugging")
  }, [])

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/outbox" element={<Outbox />} />
        <Route path="/submit-letter" element={<SubmitLetter />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/communication/:id" element={<CommunicationDetails />} />
        <Route path="/admin-console" element={<AdminConsole />} />
        <Route path="/subject/:id" element={<SubjectChronology />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/submit-letter"
            element={
              <ProtectedRoute>
                <SubmitLetter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/outbox"
            element={
              <ProtectedRoute>
                <Outbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />


      </Routes>

      {/* Global Error Monitor */}
      <ErrorPanel />
    </>
  )
}

export default App
