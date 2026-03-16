import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { adminModules } from "./admin/adminModules"
import { supabase } from "../supabaseClient"

export default function AdminConsole() {
  const { contextCode } = useParams();

  const [context, setContext] = useState({ isMedicalCollege: false, userRole: null });
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    async function loadContext() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        // Fetch Tenant context
        const { data: roles } = await supabase
          .from("user_org_roles")
          .select("organisations(organisation_type)")
          .eq("user_id", user.id);
        
        const isMed = roles?.some(r => r.organisations?.organisation_type?.toLowerCase().includes("medical college")) || profile?.role === 'SUPER_ADMIN' || false;

        setContext({
           isMedicalCollege: isMed,
           userRole: profile?.role
        });
      } catch (err) {
          console.error("Context Error:", err);
      } finally {
          setLoadingContext(false);
      }
    }
    loadContext();
  }, []);

  // Filter modules based on context
  const filteredModules = adminModules.map(m => {
    if (m.subModules) {
        return {
            ...m,
            subModules: m.subModules.filter(sm => {
                if (typeof sm.visibility === 'function') {
                    return sm.visibility({ ...context, contextCode });
                }
                return true;
            })
        };
    }
    return m;
  }).filter(m => {
      if (m.subModules && m.subModules.length === 0) return false;
      return true;
  });

  const [tab, setTab] = useState(null)
  const [subTab, setSubTab] = useState(null)

  // Initialize tabs when modules are ready
  useEffect(() => {
      if (!loadingContext && filteredModules.length > 0 && !tab) {
          setTab(filteredModules[0].id);
          if (filteredModules[0].subModules?.length > 0) {
              setSubTab(filteredModules[0].subModules[0].id);
          }
      }
  }, [loadingContext, filteredModules, tab]);

  const activeModule = filteredModules.find(m => m.id === tab)
  const isParentTab = !!activeModule?.subModules

  let ActiveComponent = null
  let currentSubModules = []

  if (isParentTab) {
    currentSubModules = activeModule.subModules
    const activeSubModule = currentSubModules.find(sm => sm.id === subTab) || currentSubModules[0]
    ActiveComponent = activeSubModule?.component
  } else {
    ActiveComponent = activeModule?.component
  }

  const handleTabChange = (moduleId) => {
    setTab(moduleId)
    const newModule = filteredModules.find(m => m.id === moduleId)
    if (newModule?.subModules?.length > 0) {
      setSubTab(newModule.subModules[0].id)
    } else {
      setSubTab(null)
    }
  }

  const env = import.meta.env.VITE_APP_ENV || "LOCAL";

  if (loadingContext) {
      return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#10293b' }}>
              <h3 style={{ fontWeight: '800' }}>INITIALIZING CONSOLE...</h3>
          </div>
      );
  }

  return (
    <div style={{
      padding: "40px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>

      {/* Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "40px",
        backgroundColor: "white",
        padding: "20px 30px",
        borderRadius: "16px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h1 style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "800",
            color: "#1e293b",
            letterSpacing: "-0.025em"
          }}>
            {contextCode ? `${contextCode} Admin Console` : "Super Admin Console"}
          </h1>
          <span style={{
            backgroundColor: env === "PROD" ? "#ef4444" :
              env === "STAGING" ? "#f59e0b" : "#3b82f6",
            color: "white",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "uppercase"
          }}>
            {env}
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {env === "DEV" && (
            <button
              onClick={() => window.open(import.meta.env.VITE_STAGING_URL || "https://gmca-ui-staging.vercel.app/", "_blank")}
              style={{
                backgroundColor: "#f59e0b",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.3)"
              }}
            >
              🚀 Promote STAGING
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{
        marginBottom: isParentTab ? "15px" : "30px",
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        backgroundColor: "#e2e8f0",
        padding: "6px",
        borderRadius: "12px",
        width: "fit-content"
      }}>
        {filteredModules.map(m => (
          <button
            key={m.id}
            onClick={() => handleTabChange(m.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: tab === m.id ? "white" : "transparent",
              color: tab === m.id ? "#1e293b" : "#64748b",
              boxShadow: tab === m.id ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Sub Tab Navigation */}
      {isParentTab && currentSubModules.length > 0 && (
        <div style={{
          marginBottom: "30px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "0 10px",
          width: "100%",
          borderBottom: "1px solid #e2e8f0"
        }}>
          {currentSubModules.map(sm => {
            const isActive = (subTab || (currentSubModules[0] ? currentSubModules[0].id : null)) === sm.id;
            return (
              <button
                key={sm.id}
                onClick={() => setSubTab(sm.id)}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  backgroundColor: "transparent",
                  fontSize: "14px",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  color: isActive ? "#3b82f6" : "#64748b",
                  borderBottom: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                  transition: "color 0.2s ease, border-bottom 0.2s ease",
                  outline: "none"
                }}
              >
                {sm.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Module Content */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
        minHeight: "500px"
      }}>
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", color: "#64748b" }}>
            Ready for Operation
          </div>
        )}
      </div>
    </div>
  )
}
