import React, { useEffect, useState } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
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
import ToastProvider from "./components/ToastProvider"

import TaskDetails from "./pages/TaskDetails"
import TaskApproval from "./pages/TaskApproval"
import TaskTimeline from "./pages/TaskTimeline"

import AdminWorkflows from "./pages/admin/AdminWorkflows"
import AdminDocs from "./pages/admin/AdminDocs"
import AdminNotifications from "./pages/admin/AdminNotifications"
import AdminSettings from "./pages/admin/AdminSettings"
import AdminOrganizations from "./pages/admin/AdminOrganizations"
import AdminWorkflowDashboard from "./pages/admin/AdminWorkflowDashboard"

import WorkflowInbox from "./pages/WorkflowInbox"
import WorkflowBuilder from "./pages/WorkflowBuilder"
import WorkflowInspector from "./pages/admin/WorkflowInspector"
import TestHeatmapAPI from "./pages/admin/TestHeatmapAPI"
import WorkflowBottleneckHeatmap from "./pages/admin/WorkflowBottleneckHeatmap"
import WorkflowControlTower from "./pages/admin/WorkflowControlTower"

import FinanceDashboard from "./pages/FinanceDashboard"
import ProcurementDashboard from "./pages/ProcurementDashboard"
import PurchaseRequisitionForm from "./pages/PurchaseRequisitionForm"
import VendorMaster from "./pages/VendorMaster"
import GoodsReceiptForm from "./pages/GoodsReceiptForm"
import ChartOfAccounts from "./pages/ChartOfAccounts"
import ItemMaster from "./pages/ItemMaster"

function App() {

  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser] = useState(null)

  useEffect(() => {

    window.supabase = supabase
    console.log("Current Environment:", import.meta.env.VITE_APP_ENV)

    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user ?? null)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {

        if (event === "PASSWORD_RECOVERY") {
          navigate("/reset-password")
        }

        setUser(session?.user ?? null)

      }
    )

    return () => {
      authListener.subscription.unsubscribe()
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

      {/* REALTIME TOAST NOTIFICATIONS */}

      <ToastProvider user={user} />

      {/* TOP NAVBAR */}

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
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <div
            style={{ cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/dashboard")}
          >
            Governance System v2.2 [SYNC_OK]
          </div>
          <span style={{
            backgroundColor: (import.meta.env.VITE_APP_ENV === "PROD" || window.location.hostname === "gmca-ui.vercel.app") ? "#ef4444" :
              (import.meta.env.VITE_APP_ENV === "STAGING" || window.location.hostname.includes("vercel.app")) ? "#f59e0b" : "#3b82f6",
            color: "white",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "bold",
            textTransform: "uppercase"
          }}>
            {(import.meta.env.VITE_APP_ENV === "PROD" || window.location.hostname === "gmca-ui.vercel.app") ? "PROD" :
             (import.meta.env.VITE_APP_ENV === "STAGING" || window.location.hostname.includes("vercel.app")) ? "(STAGING)" :
             (import.meta.env.VITE_APP_ENV || "LOCAL")}
          </span>
        </div>

        {!isPublicRoute && (
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <NotificationBell />
          </div>
        )}

      </div>

      <Routes>

        {/* PUBLIC ROUTES */}

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />


        {/* DASHBOARD */}

        <Route
          path="/"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />

        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />


        {/* COMMUNICATION SYSTEM */}

        <Route
          path="/submit-letter"
          element={<ProtectedRoute><SubmitLetter /></ProtectedRoute>}
        />

        <Route
          path="/outbox"
          element={<ProtectedRoute><Outbox /></ProtectedRoute>}
        />

        <Route
          path="/communications"
          element={<ProtectedRoute><Communications /></ProtectedRoute>}
        />

        <Route
          path="/communication/:id"
          element={<ProtectedRoute><CommunicationDetails /></ProtectedRoute>}
        />


        {/* ADMIN CONSOLE */}

        <Route
          path="/admin-console"
          element={<ProtectedRoute><AdminConsole /></ProtectedRoute>}
        />

        <Route
          path="/admin"
          element={<ProtectedRoute><AdminConsole /></ProtectedRoute>}
        />


        {/* ADMIN MODULES */}

        <Route
          path="/departments"
          element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>}
        />

        <Route
          path="/designations"
          element={<ProtectedRoute><DesignationView /></ProtectedRoute>}
        />

        <Route
          path="/admin/workflows"
          element={<ProtectedRoute><AdminWorkflows /></ProtectedRoute>}
        />

        <Route
          path="/admin/docs"
          element={<ProtectedRoute><AdminDocs /></ProtectedRoute>}
        />

        <Route
          path="/admin/notifications"
          element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>}
        />

        <Route
          path="/admin/settings"
          element={<ProtectedRoute><AdminSettings /></ProtectedRoute>}
        />

        <Route
          path="/admin/organizations"
          element={<ProtectedRoute><AdminOrganizations /></ProtectedRoute>}
        />


        {/* WORKFLOW MONITORING */}

        <Route
          path="/admin/workflow-monitor"
          element={<ProtectedRoute><AdminWorkflowDashboard /></ProtectedRoute>}
        />


        {/* WORKFLOW HEATMAP */}

        <Route
          path="/admin/workflow-heatmap"
          element={<ProtectedRoute><WorkflowBottleneckHeatmap /></ProtectedRoute>}
        />


        {/* TEST PAGE */}

        <Route
          path="/admin/test-heatmap"
          element={<ProtectedRoute><TestHeatmapAPI /></ProtectedRoute>}
        />


        {/* WORKFLOW ENGINE */}

        <Route
          path="/workflow-inbox"
          element={<ProtectedRoute><WorkflowInbox /></ProtectedRoute>}
        />

        <Route
          path="/workflow-builder/:id"
          element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>}
        />


        {/* TASKS */}

        <Route
          path="/task/:id"
          element={<ProtectedRoute><TaskDetails /></ProtectedRoute>}
        />

        <Route
          path="/task/:taskId"
          element={<ProtectedRoute><TaskApproval /></ProtectedRoute>}
        />

        <Route
          path="/timeline/:taskId"
          element={<ProtectedRoute><TaskTimeline /></ProtectedRoute>}
        />


        {/* WORKFLOW INSPECTOR */}

        <Route
          path="/admin/workflow-inspector"
          element={<ProtectedRoute><WorkflowInspector /></ProtectedRoute>}
        />

        <Route
          path="/admin/control-tower"
          element={<ProtectedRoute><WorkflowControlTower /></ProtectedRoute>}
        />

        <Route
          path="/finance"
          element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>}
        />

        <Route
          path="/procurement"
          element={<ProtectedRoute><ProcurementDashboard /></ProtectedRoute>}
        />

        <Route
          path="/procurement/new-requisition"
          element={<ProtectedRoute><PurchaseRequisitionForm /></ProtectedRoute>}
        />

        <Route
          path="/procurement/vendor-master"
          element={<ProtectedRoute><VendorMaster /></ProtectedRoute>}
        />

        <Route
          path="/procurement/goods-receipt"
          element={<ProtectedRoute><GoodsReceiptForm /></ProtectedRoute>}
        />

        <Route
          path="/finance/coa"
          element={<ProtectedRoute><ChartOfAccounts /></ProtectedRoute>}
        />

        <Route
          path="/procurement/item-master"
          element={<ProtectedRoute><ItemMaster /></ProtectedRoute>}
        />

      </Routes>

      <ErrorPanel />

    </>
  )
}

export default App