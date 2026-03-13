import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { toast, Toaster } from "react-hot-toast"

export default function Signup() {
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
    } else {
      setTenantData(data)
    }
    setFetchingTenant(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage("Registration successful. Please check your email for a verification link.")
    setLoading(false)
  }

  const brandColor = tenantData?.settings?.brand_color || "#3b82f6"
  const tenantLogo = tenantData?.settings?.logo_url || null

  return (
    <div style={pageWrapper}>
      <Toaster position="top-center" />
      
      <div style={signupCard}>
        <div style={headerSection}>
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" style={logoImage} />
          ) : (
            <div style={{ ...logoBadge, backgroundColor: brandColor }}>
              {tenantData?.tenant_code?.substring(0, 2) || "GS"}
            </div>
          )}
          
          <h2 style={title}>
            {tenantData ? `Join ${tenantData.tenant_name}` : "Create Account"}
          </h2>
          
          <p style={subtitle}>
            {tenantData 
              ? `Register for the ${tenantData.tenant_name} administrative jurisdiction.` 
              : "Register to access the Governance System."}
          </p>
        </div>

        {!message ? (
          <form onSubmit={handleSignup} style={form}>
            <div style={inputGroup}>
              <label style={label}>Work email</label>
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
              <label style={label}>Create Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
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
              {loading ? "Processing..." : "Register Now"}
            </button>
            
            <div style={footer}>
              <p style={footerText}>
                Already have an account? <Link to={`/login${tenantCode ? `?tenant=${tenantCode}` : ""}`} style={{ ...footerLink, color: brandColor }}>Sign In</Link>
              </p>
            </div>
          </form>
        ) : (
          <div style={successBox}>
            <div style={successIcon}>✉️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#10b981' }}>Check your email</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '15px' }}>{message}</p>
            <button onClick={() => navigate("/login")} style={{ ...secondaryBtn, marginTop: '24px', width: '100%' }}>Return to Login</button>
          </div>
        )}
      </div>
      
      <div style={backgroundGradient}></div>
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
  backgroundColor: "#0f172a",
  position: "relative",
  overflow: "hidden",
  fontFamily: "'Inter', system-ui, sans-serif"
}

const signupCard = {
  width: "100%",
  maxWidth: "480px",
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
  marginBottom: "40px"
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
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
}

const logoImage = {
  maxWidth: "120px",
  height: "auto",
  marginBottom: "28px"
}

const title = {
  margin: "0 0 12px 0",
  fontSize: "32px",
  fontWeight: "900",
  color: "#0f172a",
  letterSpacing: "-0.04em"
}

const subtitle = {
  margin: 0,
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#64748b",
  fontWeight: "500"
}

const form = {
  display: "flex",
  flexDirection: "column",
  gap: "24px"
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

const secondaryBtn = {
  padding: "14px",
  background: "white",
  color: "#1e293b",
  border: "2px solid #e2e8f0",
  borderRadius: "14px",
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer"
}

const footer = {
  marginTop: "32px",
  textAlign: "center",
  paddingTop: "24px",
  borderTop: "1px solid #f1f5f9"
}

const footerText = {
  margin: 0,
  fontSize: "15px",
  color: "#64748b"
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

const successBox = {
  textAlign: 'center',
  padding: '20px 0'
}

const successIcon = {
  fontSize: '48px',
  marginBottom: '16px'
}

const floater1 = {
  position: "absolute",
  top: "10%",
  left: "5%",
  width: "300px",
  height: "300px",
  background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%)",
  zIndex: 2
}

const floater2 = {
  position: "absolute",
  bottom: "10%",
  right: "5%",
  width: "400px",
  height: "400px",
  background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(0, 0, 0, 0) 70%)",
  zIndex: 2
}

