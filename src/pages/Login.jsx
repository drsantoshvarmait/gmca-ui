import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { toast, Toaster } from "react-hot-toast"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingTenant, setFetchingTenant] = useState(false)
  const [tenantData, setTenantData] = useState(null)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tenantCode = searchParams.get("tenant")

  useEffect(() => {
    if (tenantCode) {
      fetchTenantDetails()
    }
  }, [tenantCode])

  async function fetchTenantDetails() {
    setFetchingTenant(true)
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("tenant_code", tenantCode)
      .single()

    if (error) {
      console.error("Error fetching tenant:", error)
      // Allow general login if tenant not found, but toast a warning
      toast.error("Tenant configuration not found. Using default portal.")
    } else {
      setTenantData(data)
    }
    setFetchingTenant(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (!data.user.email_confirmed_at) {
      setMessage("Please confirm your email before logging in.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    navigate("/dashboard")
  }

  // Dynamic Styles based on Tenant
  const brandColor = tenantData?.settings?.brand_color || "#3b82f6"
  const tenantLogo = tenantData?.settings?.logo_url || null

  return (
    <div style={pageWrapper}>
      <Toaster position="top-center" />
      
      <div style={loginCard}>
        <div style={headerSection}>
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" style={logoImage} />
          ) : (
            <div style={{ ...logoBadge, backgroundColor: brandColor }}>
              {tenantData?.tenant_code?.substring(0, 2) || "GS"}
            </div>
          )}
          
          <h2 style={title}>
            {fetchingTenant ? "Detecting Portal..." : 
             tenantData ? `Login to ${tenantData.tenant_name}` : 
             "System Login"}
          </h2>
          
          <p style={subtitle}>
            {tenantData 
              ? `Unified Access Gateway for the ${tenantData.tenant_name} administrative jurisdiction.` 
              : "Enter your credentials to access the Governance System."}
          </p>
          
          {tenantData && (
            <div style={tenantIndicator}>
              <span style={indicatorDot}></span>
              Verified Jurisdiction: {tenantData.tenant_code}
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} style={form}>
          <div style={inputGroup}>
            <label style={label}>Email address</label>
            <input
              type="email"
              placeholder="e.g. name@department.gov"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />
          </div>

          <div style={inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={label}>Password</label>
              <Link to="/forgot-password" style={{ ...forgotLink, color: brandColor }}>Forgot password?</Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || fetchingTenant} 
            style={{ 
              ...button, 
              background: loading ? "#94a3b8" : brandColor,
              boxShadow: `0 10px 15px -3px ${brandColor}66`
            }}
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>

        {message && (
          <div style={errorBox}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{message}</span>
          </div>
        )}

        <div style={footer}>
          <p style={footerText}>
            First time here? <Link to="/signup" style={{ ...footerLink, color: brandColor }}>Request Access</Link>
          </p>
        </div>
      </div>
      
      {/* Premium Decorative Elements */}
      <div style={backgroundGradient}></div>
      <div style={bottomBar}>
        <span style={poweredText}>Powered by <strong>Governance Suite v2.0</strong></span>
        <div style={dotSeparator}></div>
        <span style={securityText}>TLS 1.3 Encryption Active</span>
      </div>

      {/* Modern floaties for depth */}
      <div style={floater1}></div>
      <div style={floater2}></div>
    </div>
  )
}

const pageWrapper = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0f172a", // Darker for more premium feel
  position: "relative",
  overflow: "hidden",
  fontFamily: "'Inter', system-ui, sans-serif"
}

const loginCard = {
  width: "100%",
  maxWidth: "460px",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(20px)",
  padding: "56px",
  borderRadius: "40px",
  boxShadow: "0 25px 80px -12px rgba(0, 0, 0, 0.5)",
  zIndex: 10,
  border: "1px solid rgba(255, 255, 255, 0.2)",
  margin: "20px"
}

const headerSection = {
  textAlign: "center",
  marginBottom: "48px"
}

const logoBadge = {
  width: "64px",
  height: "64px",
  color: "white",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: "900",
  margin: "0 auto 28px auto",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
  transition: "transform 0.3s ease"
}

const logoImage = {
  maxWidth: "120px",
  height: "auto",
  marginBottom: "28px"
}

const title = {
  margin: "0 0 14px 0",
  fontSize: "30px",
  fontWeight: "900",
  color: "#0f172a",
  letterSpacing: "-0.04em",
  lineHeight: "1.1"
}

const subtitle = {
  margin: 0,
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#64748b",
  fontWeight: "500"
}

const tenantIndicator = {
  marginTop: "20px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 16px",
  background: "#f1f5f9",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
}

const indicatorDot = {
  width: "8px",
  height: "8px",
  background: "#10b981",
  borderRadius: "50%",
  boxShadow: "0 0 10px #10b981"
}

const form = {
  display: "flex",
  flexDirection: "column",
  gap: "28px"
}

const inputGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
}

const label = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "1px"
}

const input = {
  width: "100%",
  padding: "16px 20px",
  borderRadius: "16px",
  border: "2px solid #e2e8f0",
  fontSize: "16px",
  color: "#1e293b",
  backgroundColor: "white",
  transition: "all 0.3s ease",
  outline: "none",
  boxSizing: "border-box"
}

const forgotLink = {
  fontSize: "13px",
  textDecoration: "none",
  fontWeight: "700"
}

const button = {
  width: "100%",
  padding: "18px",
  color: "white",
  border: "none",
  borderRadius: "16px",
  fontSize: "17px",
  fontWeight: "800",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  marginTop: "12px"
}

const errorBox = {
  marginTop: "32px",
  padding: "18px",
  backgroundColor: "#fef2f2",
  borderRadius: "16px",
  border: "1px solid #fee2e2",
  color: "#991b1b",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  lineHeight: "1.4",
  fontWeight: "500"
}

const footer = {
  marginTop: "48px",
  textAlign: "center",
  paddingTop: "28px",
  borderTop: "1px solid #f1f5f9"
}

const footerText = {
  margin: 0,
  fontSize: "15px",
  color: "#64748b",
  fontWeight: "500"
}

const footerLink = {
  textDecoration: "none",
  fontWeight: "800"
}

const backgroundGradient = {
  position: "absolute",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
  zIndex: 1
}

const bottomBar = {
  position: "absolute",
  bottom: "40px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  zIndex: 10,
  color: "white",
  opacity: "0.6",
  fontSize: "13px"
}

const poweredText = { fontWeight: "400" }
const securityText = { fontWeight: "500", letterSpacing: "0.5px" }
const dotSeparator = { width: "4px", height: "4px", background: "white", borderRadius: "50%" }

const floater1 = {
  position: "absolute",
  top: "10%",
  left: "5%",
  width: "300px",
  height: "300px",
  background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%)",
  zIndex: 2,
  animation: "float 20s infinite alternate"
}

const floater2 = {
  position: "absolute",
  bottom: "10%",
  right: "5%",
  width: "400px",
  height: "400px",
  background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(0, 0, 0, 0) 70%)",
  zIndex: 2,
  animation: "float 25s infinite alternate-reverse"
}
