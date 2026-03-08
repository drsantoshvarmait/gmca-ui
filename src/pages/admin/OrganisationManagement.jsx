import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

export default function OrganisationManagement() {
  const [orgs, setOrgs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newOrg, setNewOrg] = useState({
    organisation_name: "",
    tenant_id: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load Organizations
      const { data: orgData, error: orgError } = await supabase
        .from("organisations")
        .select("*")
        .order("organisation_name");

      if (orgError) throw orgError;
      setOrgs(orgData || []);

      // Load Tenants for association
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("tenant_id, tenant_name")
        .order("tenant_name");

      if (tenantError) throw tenantError;
      setTenants(tenantData || []);

      // Auto-select first tenant if available
      if (tenantData?.length > 0) {
        setNewOrg(prev => ({ ...prev, tenant_id: tenantData[0].tenant_id }));
      }

    } catch (error) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddOrg(e) {
    e.preventDefault();
    if (!newOrg.organisation_name) {
      toast.error("Organisation name is required");
      return;
    }

    const { data, error } = await supabase
      .from("organisations")
      .insert([newOrg])
      .select();

    if (error) {
      toast.error("Error creating organisation: " + error.message);
    } else {
      toast.success("Organisation created successfully!");
      setOrgs([...orgs, ...data]);
      setShowAddModal(false);
      setNewOrg({
        organisation_name: "",
        tenant_id: tenants[0]?.tenant_id || ""
      });
    }
  }

  const filteredOrgs = orgs.filter(o =>
    o.organisation_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={container}>
      <Toaster position="top-right" />

      <div style={header}>
        <h2 style={title}>Organisation Management</h2>
        <div style={actions}>
          <input
            style={searchInput}
            placeholder="Search organisations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button style={primaryBtn} onClick={() => setShowAddModal(true)}>
            + Create New Organisation
          </button>
        </div>
      </div>

      <div style={glassCard}>
        {loading ? (
          <div style={loaderText}>Fetching Organisations...</div>
        ) : (
          <table style={table}>
            <thead>
              <tr style={tableHeader}>
                <th style={th}>Organisation ID</th>
                <th style={th}>Name</th>
                <th style={th}>Parent Tenant</th>
                <th style={th}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={emptyCell}>
                    {searchTerm ? "No results found for search." : "No organisations found."}
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((o) => (
                  <tr key={o.organisation_id} style={tr}>
                    <td style={td}>{o.organisation_id.substring(0, 8)}...</td>
                    <td style={td}>
                      <span style={nameText}>{o.organisation_name}</span>
                    </td>
                    <td style={td}>
                      {tenants.find(t => t.tenant_id === o.tenant_id)?.tenant_name || (
                        <span style={grayBadge}>Not Linked</span>
                      )}
                    </td>
                    <td style={td}>{new Date(o.created_at || Date.now()).toLocaleDateString()}</td>
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
            <h3 style={modalTitle}>Register Organisation</h3>
            <form onSubmit={handleAddOrg} style={form}>
              <div style={inputGroup}>
                <label style={label}>Organisation Name</label>
                <input
                  style={input}
                  placeholder="e.g. Government Medical College Akola"
                  value={newOrg.organisation_name}
                  onChange={e => setNewOrg({ ...newOrg, organisation_name: e.target.value })}
                />
              </div>

              <div style={inputGroup}>
                <label style={label}>Parent Tenant</label>
                <select
                  style={input}
                  value={newOrg.tenant_id}
                  onChange={e => setNewOrg({ ...newOrg, tenant_id: e.target.value })}
                >
                  <option value="">-- No Link (Global) --</option>
                  {tenants.map(t => (
                    <option key={t.tenant_id} value={t.tenant_id}>
                      {t.tenant_name}
                    </option>
                  ))}
                </select>
                <p style={helpText}>Link this organisation to a specific administrative tenant.</p>
              </div>

              <div style={modalActions}>
                <button type="button" style={secondaryBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" style={primaryBtn}>Create Organisation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const container = { padding: "20px", display: "flex", flexDirection: "column", gap: "20px" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const title = { margin: 0, color: "#111827", fontSize: "24px", fontWeight: "700" };
const actions = { display: "flex", gap: "12px" };
const searchInput = { padding: "10px 16px", borderRadius: "8px", border: "1px solid #d1d5db", width: "250px" };
const primaryBtn = { background: "#10b981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };
const secondaryBtn = { background: "#fff", color: "#374151", border: "1px solid #d1d5db", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };
const glassCard = { background: "#fff", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflow: "hidden" };
const table = { width: "100%", borderCollapse: "collapse" };
const tableHeader = { background: "#f9fafb" };
const th = { textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" };
const td = { padding: "16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" };
const tr = { transition: "background 0.2s" };
const nameText = { fontWeight: "600", color: "#111827" };
const grayBadge = { background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" };
const emptyCell = { textAlign: "center", padding: "40px", color: "#9ca3af" };
const loaderText = { textAlign: "center", padding: "40px", color: "#10b981", fontWeight: "600" };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { background: "#fff", padding: "32px", borderRadius: "20px", width: "450px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" };
const modalTitle = { marginTop: 0, fontSize: "20px", fontWeight: "700", marginBottom: "24px" };
const form = { display: "flex", flexDirection: "column", gap: "16px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "6px" };
const label = { fontSize: "14px", fontWeight: "600", color: "#374151" };
const input = { padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" };
const helpText = { fontSize: "12px", color: "#6b7280", margin: 0 };
const modalActions = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" };
