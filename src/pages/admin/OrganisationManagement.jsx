import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";
import MasterSelector from "../../components/admin/MasterSelector";

export default function OrganisationManagement() {
  const [orgs, setOrgs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [userTenantId, setUserTenantId] = useState(null);

  const [newOrg, setNewOrg] = useState({
    organisation_name: "",
    organisation_code: "",
    organisation_type: "HOSPITAL",
    tenant_id: ""
  });
  const [selector, setSelector] = useState({ show: false, entityId: null, type: 'unit' });

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    setLoading(true);
    try {
      // 1. Get Current User & Profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile, error: profileError } = await supabase
        .schema("core")
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Profile load error:", profileError);
      }
      setUserProfile(profile);

      // 2. Determine Tenant Context
      let currentTenantId = null;
      if (profile.role !== 'SUPER_ADMIN') {
        // Find tenant via user_org_roles
        const { data: roles, error: roleError } = await supabase
          .from("user_org_roles")
          .select("organisation_id, organisations(tenant_id)")
          .eq("user_id", user.id)
          .limit(1);
        
        if (roleError) throw roleError;
        if (roles && roles.length > 0) {
          currentTenantId = roles[0].organisations.tenant_id;
          setUserTenantId(currentTenantId);
          setNewOrg(prev => ({ ...prev, tenant_id: currentTenantId }));
        }
      }

      // 3. Load Organizations
      let query = supabase.from("organisations").select("*").order("organisation_name");
      if (currentTenantId) {
        query = query.eq("tenant_id", currentTenantId);
      }
      const { data: orgData, error: orgError } = await query;
      if (orgError) throw orgError;
      setOrgs(orgData || []);

      // 4. Load Tenants (Only if Superadmin)
      if (profile.role === 'SUPER_ADMIN') {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("tenant_id, tenant_name")
          .order("tenant_name");
        if (tenantError) throw tenantError;
        setTenants(tenantData || []);
        if (tenantData.length > 0) {
            setNewOrg(prev => ({ ...prev, tenant_id: tenantData[0].tenant_id }));
        }
      }

    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Access restriction: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddOrg(e) {
    e.preventDefault();
    if (!newOrg.organisation_name || !newOrg.organisation_code) {
      toast.error("Name and Code are required");
      return;
    }

    const { data, error } = await supabase
      .from("organisations")
      .insert([newOrg])
      .select();

    if (error) {
      toast.error("Creation failed: " + error.message);
    } else {
      toast.success("Organisation registered successfully!");
      setOrgs([data[0], ...orgs]);
      setShowAddModal(false);
      setNewOrg({
        organisation_name: "",
        organisation_code: "",
        organisation_type: "HOSPITAL",
        tenant_id: userTenantId || tenants[0]?.tenant_id || ""
      });
    }
  }

  async function handleDeleteOrg(id) {
    if (!window.confirm("Are you sure you want to delete this organization? This cannot be undone.")) return;

    // Optimistic UI update
    const originalOrgs = [...orgs];
    setOrgs(prev => prev.filter(o => o.organisation_id !== id));

    const { error } = await supabase.from('organisations').delete().eq('organisation_id', id);
    if (error) {
      toast.error("Deletion failed: " + error.message);
      setOrgs(originalOrgs); // Rollback
    } else {
      toast.success("Organization removed successfully.");
    }
  }

  const filteredOrgs = orgs.filter(o =>
    o.organisation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.organisation_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSuper = userProfile?.role === 'SUPER_ADMIN';

  return (
    <div style={container}>
      <Toaster position="top-right" />

      <div style={header}>
        <div>
            <h2 style={title}>Organization Directory</h2>
            <p style={subtitle}>
                {isSuper ? "Managing all network organizations" : `Administering organizations for your department`}
            </p>
        </div>
        <div style={actions}>
          <input
            style={searchInput}
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button style={primaryBtn} onClick={() => setShowAddModal(true)}>
            + Add Organization
          </button>
        </div>
      </div>

      <div style={glassCard}>
        {loading ? (
          <div style={loaderText}>Consulting directory...</div>
        ) : (
          <table style={table}>
            <thead>
              <tr style={tableHeader}>
                <th style={th}>Identifier</th>
                <th style={th}>Entity Name</th>
                <th style={th}>Type</th>
                {isSuper && <th style={th}>Parent Tenant</th>}
                <th style={th}>Masters</th>
                <th style={th}>Established</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={isSuper ? "5" : "4"} style={emptyCell}>
                    {searchTerm ? "No matching entities found." : "This directory is currently empty."}
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((o) => (
                  <tr key={o.organisation_id} style={tr}>
                    <td style={td}>
                        <code style={code}>{o.organisation_code || 'N/A'}</code>
                    </td>
                    <td style={td}>
                      <span style={nameText}>{o.organisation_name}</span>
                    </td>
                    <td style={td}>
                        <span style={typeBadge}>{o.organisation_type}</span>
                    </td>
                    {isSuper && (
                        <td style={td}>
                            {tenants.find(t => t.tenant_id === o.tenant_id)?.tenant_name || "Network Global"}
                        </td>
                    )}
                    <td style={td}>
                        {isSuper ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                style={actionBtn}
                                onClick={() => setSelector({ show: true, entityId: o.organisation_id, type: 'unit' })}
                            >
                                Units
                            </button>
                            <button 
                                style={actionBtn}
                                onClick={() => setSelector({ show: true, entityId: o.organisation_id, type: 'sub_unit' })}
                            >
                                Subs
                            </button>
                            <button 
                                style={actionBtn}
                                onClick={() => setSelector({ show: true, entityId: o.organisation_id, type: 'designation' })}
                            >
                                Roles
                            </button>
                            <button 
                                style={actionBtn}
                                onClick={() => setSelector({ show: true, entityId: o.organisation_id, type: 'item' })}
                            >
                                Items
                            </button>
                            <button 
                                style={actionBtn}
                                onClick={() => setSelector({ show: true, entityId: o.organisation_id, type: 'vendor' })}
                            >
                                Vendors
                            </button>
                            <button 
                                style={{ ...actionBtn, color: '#ef4444', borderColor: '#fecaca' }} 
                                onClick={() => handleDeleteOrg(o.organisation_id)}
                            >
                                Delete
                            </button>
                          </div>
                        ) : (
                          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                             ⚡ Global Governance Active
                          </div>
                        )}
                    </td>
                    <td style={td}>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={modalTitle}>New Organization Registration</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                Registering a new sub-entity under the active administration.
            </p>
            <form onSubmit={handleAddOrg} style={form}>
              <div style={inputGroup}>
                <label style={label}>Full Entity Name</label>
                <input
                  style={input}
                  placeholder="e.g. Government Medical College Akola"
                  value={newOrg.organisation_name}
                  onChange={e => setNewOrg({ ...newOrg, organisation_name: e.target.value })}
                />
              </div>

              <div style={inputGroup}>
                <label style={label}>Unique Entity Code</label>
                <input
                  style={input}
                  placeholder="e.g. GMCA"
                  value={newOrg.organisation_code}
                  onChange={e => setNewOrg({ ...newOrg, organisation_code: e.target.value })}
                />
              </div>

              <div style={inputGroup}>
                <label style={label}>Organization Type</label>
                <select
                    style={input}
                    value={newOrg.organisation_type}
                    onChange={e => setNewOrg({ ...newOrg, organisation_type: e.target.value })}
                >
                    <option value="HOSPITAL">Hospital</option>
                    <option value="COLLEGE">Medical College</option>
                    <option value="OFFICE">Administrative Office</option>
                    <option value="PHC">Public Health Center</option>
                </select>
              </div>

              {isSuper && (
                <div style={inputGroup}>
                    <label style={label}>Parent Jurisdiction (Tenant)</label>
                    <select
                    style={input}
                    value={newOrg.tenant_id}
                    onChange={e => setNewOrg({ ...newOrg, tenant_id: e.target.value })}
                    >
                    {tenants.map(t => (
                        <option key={t.tenant_id} value={t.tenant_id}>
                        {t.tenant_name}
                        </option>
                    ))}
                    </select>
                </div>
              )}

              {!isSuper && userTenantId && (
                  <div style={restrictedBox}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>CONTEXT SECURE</span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#0c4a6e' }}>Automatically linking to your administrative jurisdiction.</p>
                  </div>
              )}

              <div style={modalActions}>
                <button type="button" style={secondaryBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" style={primaryBtn}>Initialize Entity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selector.show && (
          <MasterSelector 
              level="ORGANISATION"
              entityId={selector.entityId}
              masterType={selector.type}
              onClose={() => setSelector({ ...selector, show: false })}
          />
      )}
    </div>
  );
}

// STYLES
const container = { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" };
const title = { margin: 0, color: "#0f172a", fontSize: "32px", fontWeight: "900", letterSpacing: "-1px" };
const subtitle = { margin: "4px 0 0 0", color: "#64748b", fontSize: "15px" };
const actions = { display: "flex", gap: "16px" };
const searchInput = { padding: "12px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", width: "300px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", outline: 'none' };
const primaryBtn = { background: "#3b82f6", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.4)" };
const secondaryBtn = { background: "#fff", color: "#475569", border: "1px solid #e2e8f0", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" };
const actionBtn = { background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer" };
const glassCard = { background: "#fff", borderRadius: "24px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #f1f5f9" };
const table = { width: "100%", borderCollapse: "collapse" };
const tableHeader = { background: "#f8fafc", borderBottom: "1px solid #f1f5f9" };
const th = { textAlign: "left", padding: "16px 24px", fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" };
const td = { padding: "20px 24px", fontSize: "14px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" };
const tr = { transition: "all 0.2s" };
const nameText = { fontWeight: "700", color: "#0f172a", fontSize: "15px" };
const code = { background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", fontFamily: "monospace", color: "#475569", fontSize: "12px", border: '1px solid #e2e8f0' };
const typeBadge = { background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", textTransform: 'uppercase' };
const emptyCell = { textAlign: "center", padding: "80px", color: "#94a3b8", fontSize: "15px" };
const loaderText = { textAlign: "center", padding: "80px", color: "#3b82f6", fontWeight: "700", letterSpacing: '1px' };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { background: "#fff", padding: "40px", borderRadius: "32px", width: "500px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" };
const modalTitle = { marginTop: 0, fontSize: "24px", fontWeight: "900", marginBottom: "8px", color: '#0f172a' };
const form = { display: "flex", flexDirection: "column", gap: "20px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
const label = { fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: 'uppercase' };
const input = { padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "15px", outline: 'none' };
const restrictedBox = { background: "#f0f9ff", padding: "16px", borderRadius: "16px", border: "1px solid #bae6fd", display: 'flex', flexDirection: 'column', gap: '4px' };
const modalActions = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" };
