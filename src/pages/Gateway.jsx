import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Toaster, toast } from "react-hot-toast";

export default function Gateway() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // 1. Get Profile
      const { data: profile } = await supabase
        .schema("core")
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      setUserProfile(profile);

      // 2. Initial Data Loading
      if (profile?.role === 'SUPER_ADMIN') {
        const { data: tenantData } = await supabase.from("tenants").select("*").order("tenant_name");
        setTenants(tenantData || []);
      } else {
        // For non-superadmins, find their allowed tenants/orgs
        const { data: userRoles } = await supabase
          .from("user_org_roles")
          .select("organisation_id, organisations(organisation_name, organisation_code, tenant_id, tenants(tenant_name, tenant_code))")
          .eq("user_id", user.id);
        
        const uniqueTenants = [];
        const uniqueOrgs = [];
        const seenTenants = new Set();

        (userRoles || []).forEach(ur => {
           const t = ur.organisations.tenants;
           const o = ur.organisations;
           if (!seenTenants.has(t.tenant_id)) {
              uniqueTenants.push(t);
              seenTenants.add(t.tenant_id);
           }
           uniqueOrgs.push(o);
        });

        setTenants(uniqueTenants);
        setOrgs(uniqueOrgs);
        if (uniqueTenants.length === 1) setSelectedTenant(uniqueTenants[0].tenant_id);
      }
    } catch (err) {
      toast.error("Failed to initialize gateway");
    } finally {
      setLoading(false);
    }
  }

  // Effect to load organizations when tenant changes (for Superadmins)
  useEffect(() => {
    if (selectedTenant && userProfile?.role === 'SUPER_ADMIN') {
        fetchOrgsForTenant(selectedTenant);
    }
  }, [selectedTenant]);

  async function fetchOrgsForTenant(tenantId) {
    const { data } = await supabase
        .from("organisations")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("organisation_name");
    setOrgs(data || []);
    setSelectedOrg("");
  }

  const handleNavigate = (path) => {
    if (!path) {
        toast.error("Invalid path");
        return;
    }
    navigate(path);
  };

  const currentTenantCode = tenants.find(t => t.tenant_id === selectedTenant)?.tenant_code;
  const currentOrgCode = orgs.find(o => o.organisation_id === selectedOrg)?.organisation_code;

  if (loading) return <div style={loaderView}>Entering Governance Gateway...</div>;

  return (
    <div style={container}>
      <Toaster position="top-center" />
      
      {/* BACKGROUND DECORATION */}
      <div style={blob1}></div>
      <div style={blob2}></div>

      <div style={glassMain}>
        <div style={header}>
            <div style={logoArea}>
                <span style={logoIcon}>💠</span>
                <h1 style={logoText}>Governance Gateway</h1>
            </div>
            <div style={userBadge}>
                <span style={userEmail}>{userProfile?.email}</span>
                <span style={roleTag}>{userProfile?.role}</span>
            </div>
        </div>

        <div style={grid}>
            {/* TIER 1: GLOBAL CONSOLE */}
            {userProfile?.role === 'SUPER_ADMIN' && (
                <div style={card}>
                    <div style={cardHeader}>
                        <h3 style={cardTitle}>Superadmin Control</h3>
                        <p style={cardSub}>Global governance and system orchestration</p>
                    </div>
                    <button style={primaryBtn} onClick={() => handleNavigate('/superadmin-console')}>
                        Open System Console ↗
                    </button>
                    <div style={decorator}>MASTER</div>
                </div>
            )}

            {/* TIER 2 & 3: JURISDICTION ACCESS */}
            <div style={{ ...card, gridColumn: userProfile?.role === 'SUPER_ADMIN' ? 'span 1' : 'span 2' }}>
                <div style={cardHeader}>
                    <h3 style={cardTitle}>Regional & Entity Access</h3>
                    <p style={cardSub}>Navigate to specific Tenant or Organisation dashboards</p>
                </div>
                
                <div style={formStack}>
                    <div style={inputGroup}>
                        <label style={label}>Select Jurisdiction (Tenant)</label>
                        <select 
                            style={select} 
                            value={selectedTenant} 
                            onChange={(e) => setSelectedTenant(e.target.value)}
                        >
                            <option value="">-- Choose Tenant --</option>
                            {tenants.map(t => (
                                <option key={t.tenant_id} value={t.tenant_id}>{t.tenant_name} ({t.tenant_code})</option>
                            ))}
                        </select>
                    </div>

                    <div style={inputGroup}>
                        <label style={label}>Select Organisation</label>
                        <select 
                            style={select} 
                            value={selectedOrg} 
                            onChange={(e) => setSelectedOrg(e.target.value)}
                            disabled={!selectedTenant}
                        >
                            <option value="">-- Choose Organisation --</option>
                            {orgs.map(o => (
                                <option key={o.organisation_id} value={o.organisation_id}>{o.organisation_name} ({o.organisation_code})</option>
                            ))}
                        </select>
                    </div>

                    <div style={actionRow}>
                        <button 
                            style={secondaryBtn} 
                            disabled={!selectedTenant}
                            onClick={() => handleNavigate(`/${currentTenantCode}/admin-console`)}
                        >
                            Tenant Admin
                        </button>
                        <button 
                            style={secondaryBtn} 
                            disabled={!selectedOrg}
                            onClick={() => handleNavigate(`/${currentOrgCode}/dashboard`)}
                        >
                            Org Dashboard
                        </button>
                        <button 
                            style={secondaryBtn} 
                            disabled={!selectedOrg}
                            onClick={() => handleNavigate(`/${currentOrgCode}/admin-console`)}
                        >
                            Org Admin
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div style={footer}>
            <p>© 2026 Governance Systems v2.2 | Multi-Tier Integrated Architecture</p>
        </div>
      </div>
    </div>
  );
}

// PREMIUM STYLES
const container = {
  minHeight: "100vh",
  background: "#0f172a",
  color: "white",
  fontFamily: "'Inter', sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  position: "relative",
  overflow: "hidden"
};

const glassMain = {
  width: "100%",
  maxWidth: "900px",
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "32px",
  padding: "40px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  position: "relative",
  zIndex: 10
};

const blob1 = {
  position: "absolute",
  top: "-100px",
  left: "-100px",
  width: "400px",
  height: "400px",
  background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 70%)",
  borderRadius: "50%",
  zIndex: 1
};

const blob2 = {
  position: "absolute",
  bottom: "-100px",
  right: "-100px",
  width: "500px",
  height: "500px",
  background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)",
  borderRadius: "50%",
  zIndex: 1
};

const header = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px" };
const logoArea = { display: "flex", alignItems: "center", gap: "12px" };
const logoIcon = { fontSize: "32px" };
const logoText = { fontSize: "24px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" };
const userBadge = { display: "flex", flexDirection: "column", alignItems: "flex-end" };
const userEmail = { fontSize: "14px", fontWeight: "600", color: "#94a3b8" };
const roleTag = { fontSize: "11px", fontWeight: "700", background: "#3b82f6", color: "white", padding: "2px 8px", borderRadius: "4px", marginTop: "4px", textTransform: "uppercase" };

const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };
const card = { 
    background: "rgba(15, 23, 42, 0.4)", 
    padding: "32px", 
    borderRadius: "24px", 
    border: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden"
};

const cardHeader = { marginBottom: "24px" };
const cardTitle = { fontSize: "20px", fontWeight: "700", margin: "0 0 8px 0" };
const cardSub = { fontSize: "14px", color: "#94a3b8", lineHeight: "1.5" };

const formStack = { display: "flex", flexDirection: "column", gap: "16px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
const label = { fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" };
const select = { 
    background: "#0f172a", 
    border: "1px solid #334155", 
    color: "white", 
    padding: "12px", 
    borderRadius: "12px", 
    fontSize: "14px",
    outline: "none"
};

const actionRow = { display: "flex", gap: "8px", marginTop: "12px" };

const primaryBtn = { 
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", 
    color: "white", 
    border: "none", 
    padding: "16px", 
    borderRadius: "16px", 
    fontWeight: "700", 
    cursor: "pointer",
    transition: "transform 0.2s"
};

const secondaryBtn = {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "12px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s"
};

const decorator = {
    position: "absolute",
    top: "10px",
    right: "-30px",
    background: "rgba(59, 130, 246, 0.1)",
    padding: "5px 40px",
    transform: "rotate(45deg)",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "2px",
    color: "#3b82f6"
};

const footer = { marginTop: "40px", textAlign: "center", fontSize: "12px", color: "#475569" };
const loaderView = { minHeight: "100vh", background: "#0f172a", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" };
