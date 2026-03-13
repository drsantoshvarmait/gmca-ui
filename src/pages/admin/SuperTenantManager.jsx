import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry"
];

const STATE_OFFICIAL_LANGUAGES = {
    "Maharashtra": "Marathi",
    "Gujarat": "Gujarati",
    "Karnataka": "Kannada",
    "Tamil Nadu": "Tamil",
    "Andhra Pradesh": "Telugu",
    "Telangana": "Telugu",
    "Kerala": "Malayalam",
    "West Bengal": "Bengali",
    "Odisha": "Odia",
    "Punjab": "Punjabi",
    "Assam": "Assamese",
    "Goa": "Konkani",
    "Manipur": "Meiteilon",
    "Tripura": "Bengali",
    "Sikkim": "Nepali",
    "Mizoram": "Mizo",
    // Defaulting Hindi for major Hindi belt and others to English
    "Bihar": "Hindi", "Uttar Pradesh": "Hindi", "Madhya Pradesh": "Hindi", "Rajasthan": "Hindi",
    "Haryana": "Hindi", "Himachal Pradesh": "Hindi", "Chhattisgarh": "Hindi", "Jharkhand": "Hindi",
    "Delhi": "Hindi", "Uttarakhand": "Hindi", "Chandigarh": "Hindi"
};

export default function SuperTenantManager() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showEditTenant, setShowEditTenant] = useState(false);
  const [orgs, setOrgs] = useState([]);

  // Form States
  const [newTenant, setNewTenant] = useState({
    tenant_name: "",
    tenant_code: "",
    tenant_type: "GOVERNMENT",
    gov_level: "STATE",
    state_name: "Maharashtra",
    brand_color: "#3b82f6",
    logo_url: "",
    settings: {}
  });

  const [editTenantData, setEditTenantData] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant && selectedTenant.tenant_id) {
      fetchOrgs(selectedTenant.tenant_id);
    } else {
      setOrgs([]);
    }
  }, [selectedTenant]);

  async function fetchTenants() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch tenants: " + error.message);
    } else {
      setTenants(data || []);
    }
    setLoading(false);
  }

  async function fetchOrgs(tenantId) {
    const { data, error } = await supabase
      .from("organisations")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch organizations: " + error.message);
    } else {
      setOrgs(data || []);
    }
  }

  async function handleCreateTenant(e) {
    e.preventDefault();
    if (!newTenant.tenant_name || !newTenant.tenant_code) {
      toast.error("Tenant Name and Code are required");
      return;
    }

    const stateLang = (newTenant.tenant_type === 'GOVERNMENT' && newTenant.gov_level === 'STATE') 
        ? (STATE_OFFICIAL_LANGUAGES[newTenant.state_name] || "English") 
        : "English";

    const finalSettings = {
        ...newTenant.settings,
        category: newTenant.tenant_type,
        gov_level: newTenant.tenant_type === 'GOVERNMENT' ? newTenant.gov_level : null,
        state: (newTenant.tenant_type === 'GOVERNMENT' && newTenant.gov_level === 'STATE') ? newTenant.state_name : null,
        official_language: stateLang,
        brand_color: newTenant.brand_color,
        logo_url: newTenant.logo_url
    };

    const payload = {
        tenant_name: newTenant.tenant_name,
        tenant_code: newTenant.tenant_code,
        tenant_type: newTenant.tenant_type,
        settings: finalSettings
    };

    const { data, error } = await supabase
      .from("tenants")
      .insert([payload])
      .select();

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Tenant established!");
      setTenants([data[0], ...tenants]);
      setShowAddTenant(false);
      resetNewForm();
    }
  }

  async function handleUpdateTenant(e) {
    e.preventDefault();
    if (!editTenantData.tenant_name) {
      toast.error("Name is required");
      return;
    }

    const stateLang = (editTenantData.tenant_type === 'GOVERNMENT' && editTenantData.gov_level === 'STATE') 
        ? (STATE_OFFICIAL_LANGUAGES[editTenantData.state_name] || "English") 
        : "English";

    const { error } = await supabase
      .from("tenants")
      .update({
        tenant_name: editTenantData.tenant_name,
        tenant_type: editTenantData.tenant_type,
        status: editTenantData.status,
        settings: {
            ...editTenantData.settings,
            category: editTenantData.tenant_type,
            gov_level: editTenantData.tenant_type === 'GOVERNMENT' ? editTenantData.gov_level : null,
            state: (editTenantData.tenant_type === 'GOVERNMENT' && editTenantData.gov_level === 'STATE') ? editTenantData.state_name : null,
            official_language: stateLang,
            brand_color: editTenantData.brand_color,
            logo_url: editTenantData.logo_url
        }
      })
      .eq("tenant_id", editTenantData.tenant_id);

    if (error) {
      toast.error("Update failed: " + error.message);
    } else {
      toast.success("Tenant updated successfully!");
      setShowEditTenant(false);
      fetchTenants(); // Refresh list
      // Update selected tenant view if it matches
      if (selectedTenant?.tenant_id === editTenantData.tenant_id) {
          setSelectedTenant({ ...selectedTenant, ...editTenantData, settings: { ...editTenantData.settings, official_language: stateLang } });
      }
    }
  }

  const resetNewForm = () => {
    setNewTenant({
        tenant_name: "",
        tenant_code: "",
        tenant_type: "GOVERNMENT",
        gov_level: "STATE",
        state_name: "Maharashtra",
        brand_color: "#3b82f6",
        logo_url: "",
        settings: {}
    });
  };

  const openEditModal = () => {
    setEditTenantData({
        ...selectedTenant,
        gov_level: selectedTenant.settings?.gov_level || "STATE",
        state_name: selectedTenant.settings?.state || "Maharashtra",
        brand_color: selectedTenant.settings?.brand_color || "#3b82f6",
        logo_url: selectedTenant.settings?.logo_url || ""
    });
    setShowEditTenant(true);
  };

  return (
    <div style={container}>
      <Toaster position="top-right" />

      {/* Hero Section */}
      <div style={hero}>
        <div style={heroText}>
          <h1 style={heroTitle}>Tenant Directory</h1>
          <p style={heroSub}>Superadmin Console for Global Governance & Regional Compliance</p>
        </div>
        <button style={mainActionBtn} onClick={() => setShowAddTenant(true)}>
          + Add Tenant
        </button>
      </div>

      <div style={mainLayout}>
        {/* Left Panel: Tenant List */}
        <div style={sidePanel}>
          <h3 style={panelTitle}>Jurisdictions ({tenants.length})</h3>
          <div style={listContainer}>
            {loading ? (
              <p style={statusMsg}>Loading...</p>
            ) : tenants.length === 0 ? (
              <p style={statusMsg}>No tenants found.</p>
            ) : (
              tenants.map(t => (
                <div
                  key={t.tenant_id}
                  onClick={() => setSelectedTenant(t)}
                  style={{
                    ...tenantCard,
                    borderColor: selectedTenant?.tenant_id === t.tenant_id ? "#3b82f6" : "transparent",
                    background: selectedTenant?.tenant_id === t.tenant_id ? "#eff6ff" : "white",
                    boxShadow: selectedTenant?.tenant_id === t.tenant_id ? "0 4px 6px -1px rgba(59, 130, 246, 0.1)" : "none"
                  }}
                >
                  <div style={tenantInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={tenantBrand}>{t.tenant_code}</span>
                        {t.status === 'INACTIVE' && <span style={{ ...badge, background: '#fee2e2', color: '#b91c1c' }}>Inactive</span>}
                    </div>
                    <span style={tenantName}>{t.tenant_name}</span>
                  </div>
                  <div style={tenantMeta}>
                    <span style={badge}>{t.tenant_type}</span>
                    {t.settings?.state && <span style={badge}>{t.settings.state}</span>}
                    {t.settings?.official_language && <span style={langBadge}>{t.settings.official_language}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Selected Tenant Overview */}
        <div style={contentArea}>
          {selectedTenant ? (
            <>
              <div style={tenantHeader}>
                <div style={headerMain}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={selectedTitle}>{selectedTenant.tenant_name}</h2>
                    <span style={selectedCode}>{selectedTenant.tenant_code}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>ID: {selectedTenant.tenant_id}</span>
                      <div style={{ width: '4px', height: '4px', background: '#cbd5e1', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Language Overlay: {selectedTenant.settings?.official_language || 'English (Standard)'}</span>
                  </div>
                </div>
                <div style={headerActions}>
                  <button 
                    style={portalActionBtn} 
                    onClick={() => {
                      const url = `${window.location.origin}/login?tenant=${selectedTenant.tenant_code}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Login URL copied to clipboard!");
                    }}
                  >
                    Copy Login Link 🔗
                  </button>
                  <button 
                    style={portalActionBtn} 
                    onClick={() => window.open(`/login?tenant=${selectedTenant.tenant_code}`, '_blank')}
                  >
                    Tenant Login ↗
                  </button>
                  <button style={editActionBtn} onClick={openEditModal}>Edit Tenant</button>
                </div>
              </div>

              {/* Organization List View Only */}
              <div style={orgSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <h3 style={{ ...panelTitle, margin: 0 }}>Associated Entities ({orgs.length})</h3>
                  <div style={titleLine}></div>
                </div>
                
                <div style={orgGrid}>
                  {orgs.length === 0 ? (
                    <div style={emptyOrgState}>
                      <div style={{ fontSize: '32px' }}>🏢</div>
                      <p>No organizations are currently linked to this jurisdiction.</p>
                      <p style={{ fontSize: '13px', color: '#94a3b8' }}>Managed via Tenant Admin portal.</p>
                    </div>
                  ) : (
                    orgs.map(o => (
                      <div key={o.organisation_id} style={orgCard}>
                        <div style={orgCardHeader}>
                          <span style={orgCode}>{o.organisation_code}</span>
                          <span style={smallBadge}>{o.organisation_type}</span>
                        </div>
                        <h4 style={orgName}>{o.organisation_name}</h4>
                        <div style={orgFooter}>
                          <span style={orgIdText}>UID: {o.organisation_id.substring(0,8)}...</span>
                          <span style={statusDot}></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={infoBox}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                    <strong>Compliance & Localization:</strong> 1. If Category is "State Government", the system automatically flags the official regional language ({selectedTenant.settings?.official_language}) for localization across all sub-entities. 2. Operational unit composition is defined by the Organisation Type assigned at creation.
                  </p>
              </div>
            </>
          ) : (
            <div style={emptyState}>
              <div style={emptyIcon}>🌍</div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Global Administration View</h3>
              <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>Select a jurisdiction from the directory to inspect its hierarchy, update regional compliance data, or audit its constituent entity status.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddTenant && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={modalTitle}>Add New Tenant</h3>
            <p style={modalSub}>Define a new administrative jurisdiction and its regional overlay.</p>
            <form onSubmit={handleCreateTenant} style={form}>
              
              <div style={inputGroup}>
                <label style={label}>Category</label>
                <select
                  style={input}
                  value={newTenant.tenant_type}
                  onChange={e => setNewTenant({ ...newTenant, tenant_type: e.target.value })}
                >
                  <option value="GOVERNMENT">Government</option>
                  <option value="NON_GOVERNMENT">Non Government</option>
                </select>
              </div>

              {newTenant.tenant_type === 'GOVERNMENT' && (
                  <div style={govBox}>
                    <div style={inputGroup}>
                        <label style={label}>Government Level</label>
                        <select
                        style={input}
                        value={newTenant.gov_level}
                        onChange={e => setNewTenant({ ...newTenant, gov_level: e.target.value })}
                        >
                        <option value="CENTRAL">Central Government</option>
                        <option value="STATE">State Government</option>
                        </select>
                    </div>

                    {newTenant.gov_level === 'STATE' && (
                        <div style={inputGroup}>
                            <label style={label}>Select Indian State</label>
                            <select
                            style={input}
                            value={newTenant.state_name}
                            onChange={e => setNewTenant({ ...newTenant, state_name: e.target.value })}
                            >
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                  </div>
              )}

              <div style={inputGroup}>
                <label style={label}>Tenant Name</label>
                <input
                style={input}
                placeholder="e.g. Higher Education Dept"
                value={newTenant.tenant_name}
                onChange={e => setNewTenant({ ...newTenant, tenant_name: e.target.value })}
                />
              </div>

              <div style={inputGroup}>
                <label style={label}>Unique Code</label>
                <input
                style={input}
                placeholder="e.g. HED"
                value={newTenant.tenant_code}
                onChange={e => setNewTenant({ ...newTenant, tenant_code: e.target.value })}
                />
              </div>

              <div style={brandingBox}>
                <p style={boxTitle}>Branding Configuration</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={inputGroup}>
                    <label style={label}>Brand Color</label>
                    <input
                      type="color"
                      style={{ ...input, padding: '4px', height: '48px' }}
                      value={newTenant.brand_color}
                      onChange={e => setNewTenant({ ...newTenant, brand_color: e.target.value })}
                    />
                  </div>
                  <div style={inputGroup}>
                    <label style={label}>Logo URL</label>
                    <input
                      style={input}
                      placeholder="https://..."
                      value={newTenant.logo_url}
                      onChange={e => setNewTenant({ ...newTenant, logo_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={modalActions}>
                <button type="button" style={secondaryBtn} onClick={() => setShowAddTenant(false)}>Cancel</button>
                <button type="submit" style={primaryBtn}>Add Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditTenant && editTenantData && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={modalTitle}>Edit Tenant Details</h3>
            <p style={modalSub}>Updating core classification for <strong>{selectedTenant.tenant_code}</strong>.</p>
            <form onSubmit={handleUpdateTenant} style={form}>
              
              <div style={inputGroup}>
                <label style={label}>Tenant Name</label>
                <input
                  style={input}
                  value={editTenantData.tenant_name}
                  onChange={e => setEditTenantData({ ...editTenantData, tenant_name: e.target.value })}
                />
              </div>

              <div style={inputGroup}>
                <label style={label}>Jurisdiction Status</label>
                <select
                  style={input}
                  value={editTenantData.status}
                  onChange={e => setEditTenantData({ ...editTenantData, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Suspended</option>
                </select>
              </div>

              <div style={inputGroup}>
                <label style={label}>Classification</label>
                <select
                  style={input}
                  value={editTenantData.tenant_type}
                  onChange={e => setEditTenantData({ ...editTenantData, tenant_type: e.target.value })}
                >
                  <option value="GOVERNMENT">Government</option>
                  <option value="NON_GOVERNMENT">Non Government</option>
                </select>
              </div>

              {editTenantData.tenant_type === 'GOVERNMENT' && (
                  <div style={govBox}>
                    <div style={inputGroup}>
                        <label style={label}>Level</label>
                        <select
                        style={input}
                        value={editTenantData.gov_level}
                        onChange={e => setEditTenantData({ ...editTenantData, gov_level: e.target.value })}
                        >
                        <option value="CENTRAL">Central Government</option>
                        <option value="STATE">State Government</option>
                        </select>
                    </div>
                    {editTenantData.gov_level === 'STATE' && (
                        <div style={inputGroup}>
                            <label style={label}>Assigned State</label>
                            <select
                            style={input}
                            value={editTenantData.state_name}
                            onChange={e => setEditTenantData({ ...editTenantData, state_name: e.target.value })}
                            >
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                  </div>
              )}

              <div style={brandingBox}>
                <p style={boxTitle}>Branding Configuration</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={inputGroup}>
                    <label style={label}>Brand Color</label>
                    <input
                      type="color"
                      style={{ ...input, padding: '4px', height: '48px' }}
                      value={editTenantData.brand_color}
                      onChange={e => setEditTenantData({ ...editTenantData, brand_color: e.target.value })}
                    />
                  </div>
                  <div style={inputGroup}>
                    <label style={label}>Logo URL</label>
                    <input
                      style={input}
                      placeholder="https://..."
                      value={editTenantData.logo_url}
                      onChange={e => setEditTenantData({ ...editTenantData, logo_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={modalActions}>
                <button type="button" style={secondaryBtn} onClick={() => setShowEditTenant(false)}>Cancel</button>
                <button type="submit" style={primaryBtn}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const container = { padding: "0", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" };
const hero = { padding: "40px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" };
const heroText = { display: "flex", flexDirection: "column", gap: "4px" };
const heroTitle = { margin: 0, fontSize: "32px", fontWeight: "900", letterSpacing: "-1px" };
const heroSub = { margin: "4px 0 0 0", color: "#94a3b8", fontSize: "16px", fontWeight: "500" };
const mainActionBtn = { background: "#3b82f6", color: "white", border: "none", padding: "14px 28px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.4)", transition: "all 0.2s" };

const mainLayout = { display: "grid", gridTemplateColumns: "350px 1fr", gap: "0", height: "calc(100vh - 160px)" };
const sidePanel = { background: "white", borderRight: "1px solid #e2e8f0", padding: "30px", overflowY: "auto" };
const panelTitle = { margin: "0 0 20px 0", fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "800", letterSpacing: "1.5px" };
const listContainer = { display: "flex", flexDirection: "column", gap: "12px" };

const tenantCard = { padding: "18px", borderRadius: "16px", cursor: "pointer", transition: "all 0.2s", border: "2px solid transparent", position: "relative" };
const tenantInfo = { display: "flex", flexDirection: "column" };
const tenantBrand = { fontSize: "11px", fontWeight: "900", color: "#3b82f6", background: "#dbeafe", alignSelf: "flex-start", padding: "2px 8px", borderRadius: "6px", marginBottom: "8px", letterSpacing: "0.5px" };
const tenantName = { fontSize: "15px", fontWeight: "700", color: "#1e293b", lineHeight: "1.4" };
const tenantMeta = { marginTop: "12px", display: "flex", gap: "6px", flexWrap: 'wrap' };
const badge = { fontSize: "9px", background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontWeight: "800", textTransform: "uppercase" };
const langBadge = { fontSize: "9px", background: "#ecfdf5", color: "#059669", padding: "4px 8px", borderRadius: "6px", fontWeight: "800", textTransform: "uppercase", border: '1px solid #d1fae5' };

const contentArea = { padding: "40px 60px", overflowY: "auto" };
const tenantHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" };
const headerMain = { display: "flex", flexDirection: "column" };
const selectedTitle = { margin: 0, fontSize: "32px", fontWeight: "900", color: "#0f172a", letterSpacing: "-1px" };
const selectedCode = { fontSize: "14px", color: "#3b82f6", background: "#dbeafe", padding: "4px 12px", borderRadius: "20px", fontWeight: "800" };
const headerActions = { display: "flex", gap: "12px" };
const editActionBtn = { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "13px" };
const portalActionBtn = { background: "#1e293b", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" };

const orgSection = { marginTop: "20px" };
const titleLine = { flex: 1, height: "1px", background: "#e2e8f0" };
const orgGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px", marginTop: "24px" };
const orgCard = { background: "white", padding: "24px", borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "default", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
const orgCardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const orgCode = { fontSize: "11px", fontWeight: "900", color: "#059669", background: "#d1fae5", padding: "3px 10px", borderRadius: "6px", letterSpacing: "0.5px" };
const orgName = { margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b", lineHeight: "1.3" };
const orgFooter = { marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" };
const orgIdText = { fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" };
const statusDot = { width: "8px", height: "8px", background: "#10b981", borderRadius: "50%" };
const smallBadge = { fontSize: "9px", color: "#64748b", background: "#f8fafc", padding: "4px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "700" };

const emptyOrgState = { gridColumn: "1 / -1", padding: "60px", background: "white", borderRadius: "24px", border: "2px dashed #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#94a3b8", textAlign: "center" };
const infoBox = { marginTop: "50px", background: "#f1f5f9", padding: "24px", borderRadius: "20px", border: "1px solid #ecf0f3" };

const primaryBtn = { background: "#3b82f6", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" };
const secondaryBtn = { background: "white", color: "#475569", border: "1px solid #cbd5e1", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" };

const emptyState = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "#94a3b8", textAlign: "center" };
const emptyIcon = { fontSize: "80px", marginBottom: "24px", opacity: 0.5 };
const statusMsg = { textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" };

const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { background: "white", padding: "48px", borderRadius: "32px", width: "550px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" };
const modalTitle = { marginTop: 0, fontSize: "28px", fontWeight: "900", marginBottom: "8px", color: "#1e293b", letterSpacing: "-0.5px" };
const modalSub = { margin: "0 0 32px 0", fontSize: "15px", color: "#64748b", lineHeight: "1.5" };
const form = { display: "flex", flexDirection: "column", gap: "24px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
const label = { fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" };
const input = { padding: "14px 18px", borderRadius: "14px", border: "1px solid #e2e8f0", fontSize: "16px", outline: "none", background: "#f8fafc", transition: "all 0.2s", width: '100%', boxSizing: 'border-box' };
const modalActions = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" };
const govBox = { background: "#f0f9ff", padding: "20px", borderRadius: "16px", border: "1px solid #bae6fd", display: "flex", flexDirection: "column", gap: "20px" };
const brandingBox = { background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px" };
const boxTitle = { margin: 0, fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' };
