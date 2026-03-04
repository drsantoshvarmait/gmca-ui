import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
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
import NotificationBell from "./components/NotificationBell"
import TaskDetails from "./pages/TaskDetails"

/* NEW PAGE */
import WorkflowInbox from "./pages/WorkflowInbox"

function App() {

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {

    window.supabase = supabase

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          navigate("/reset-password")
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [navigate])

  const isPublicRoute = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password"
  ].includes(location.pathname)

  return (

    <>

      {/* TOP NAVBAR */}
      {!isPublicRoute && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            backgroundColor: "#1f2937",
            color: "white"
          }}
        >

          <div
            style={{ cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/dashboard")}
          >
            Governance System
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <NotificationBell />
          </div>

        </div>
      )}

      <Routes>

        {/* PUBLIC ROUTES */}

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />


        {/* DASHBOARD */}

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


        {/* COMMUNICATION SYSTEM */}

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


        {/* ADMIN */}

        <Route
          path="/admin-console"
          element={
            <ProtectedRoute>
              <AdminConsole />
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


        {/* SUBJECT TRACKING */}

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


        {/* WORKFLOW ENGINE */}

        <Route
          path="/workflow-inbox"
          element={
            <ProtectedRoute>
              <WorkflowInbox />
            </ProtectedRoute>
          }
        />


        {/* TASK DETAILS */}

        <Route
          path="/task/:id"
          element={
            <ProtectedRoute>
              <TaskDetails />
            </ProtectedRoute>
          }
        />

      </Routes>

      <ErrorPanel />

    </>
  )
}

export default App