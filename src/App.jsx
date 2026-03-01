import { Routes, Route, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { supabase } from "./supabaseClient"

import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import SubmitLetter from "./pages/SubmitLetter"
import Communications from "./pages/Communications"
import CommunicationDetails from "./pages/CommunicationDetails"
import AdminConsole from "./pages/AdminConsole"
import Outbox from "./pages/Outbox"
import SubjectChronology from "./pages/SubjectChronology"
import IssueStock from "./pages/IssueStock"
import DepartmentsPage from "./pages/DepartmentsPage"
import DesignationView from "./pages/admin/DesignationView"

import ProtectedRoute from "./components/ProtectedRoute"
import ErrorPanel from "./components/ErrorPanel"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    window.supabase = supabase

    // 🔥 Detect password recovery event globally
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          navigate("/reset-password")
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
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
          path="/communications"
          element={
            <ProtectedRoute>
              <Communications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/communication/:id"
          element={
            <ProtectedRoute>
              <CommunicationDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-console"
          element={
            <ProtectedRoute>
              <AdminConsole />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subject/:id"
          element={
            <ProtectedRoute>
              <SubjectChronology />
            </ProtectedRoute>
          }
        />

        <Route
          path="/issue-stock"
          element={
            <ProtectedRoute>
              <IssueStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/designations"
          element={
            <ProtectedRoute>
              <DesignationView />
            </ProtectedRoute>
          }
        />
      </Routes>

      <ErrorPanel />
    </>
  )
}

export default App