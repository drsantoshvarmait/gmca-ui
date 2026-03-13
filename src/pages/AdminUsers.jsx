import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // For modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleForm, setRoleForm] = useState({
    organisation_id: "",
    role_id: ""
  });

  async function loadData() {
    setLoading(true);
    try {
      // Fetch users
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

      // Fetch orgs
      const { data: organisations } = await supabase.from("organisations").select("organisation_id, organisation_name");

      // Fetch available roles defined by tenant
      const { data: dbRoles } = await supabase.from("roles").select("role_id, role_name, tenant_id");

      // Fetch assigned user_roles
      const { data: assignedRoles } = await supabase.from("user_roles").select("*, roles(role_name), organisations(organisation_name)");

      setUsers(profiles || []);
      setOrgs(organisations || []);
      setRoles(dbRoles || []);
      setUserRoles(assignedRoles || []);
    } catch (err) {
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function assignOrgRole(e) {
    e.preventDefault();
    if (!roleForm.organisation_id || !roleForm.role_id) {
      toast.error("Please select both an organisation and a role.");
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: selectedUser.id,
      organisation_id: roleForm.organisation_id,
      role_id: roleForm.role_id
    });

    if (error) {
      toast.error("Failed to assign role: " + error.message);
    } else {
      toast.success("Role successfully assigned!");
      setShowRoleModal(false);
      loadData();
    }
  }

  async function removeOrgRole(userRoleId) {
    const { error } = await supabase.from("user_roles").delete().eq("user_role_id", userRoleId);
    if (!error) loadData();
  }

  if (loading) return <div style={{ padding: 40 }}>Loading users...</div>;

  return (
    <div style={container}>
      <Toaster />
      <div style={header}>
        <h2 style={title}>User & Organisation Assignment</h2>
      </div>

      <div style={glassCard}>
        <table style={table}>
          <thead>
            <tr style={tableHeader}>
              <th style={th}>User Email</th>
              <th style={th}>Global Access</th>
              <th style={th}>Assigned Organisations & Roles</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const myRoles = userRoles.filter(ur => ur.user_id === user.id);
              return (
                <tr key={user.id} style={tr}>
                  <td style={td}>
                    <div style={nameText}>{user.email}</div>
                    <div style={{ fontSize: "12px", color: user.is_approved ? "#10b981" : "#f59e0b" }}>
                      {user.is_approved ? "Approved" : "Pending"}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={user.role === "admin" ? adminBadge : userBadge}>
                      {user.role === "admin" ? "Superadmin" : "Standard"}
                    </span>
                  </td>
                  <td style={td}>
                    {myRoles.length === 0 ? (
                      <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "13px" }}>No orgs assigned</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {myRoles.map(ur => (
                          <div key={ur.user_role_id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                            <span style={{ fontWeight: "600", color: "#374151" }}>{ur.organisations?.organisation_name}</span>
                            <span style={{ color: "#6b7280" }}>({ur.roles?.role_name || "Unknown Role"})</span>
                            <button onClick={() => removeOrgRole(ur.user_role_id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", padding: 0 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    <button
                      style={secondaryBtn}
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRoleModal(true);
                      }}
                    >
                      + Assign Org Access
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showRoleModal && selectedUser && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={modalTitle}>Assign Org Role for {selectedUser.email}</h3>
            <form onSubmit={assignOrgRole} style={form}>
              <div style={inputGroup}>
                <label style={label}>Organisation</label>
                <select style={input} value={roleForm.organisation_id} onChange={e => setRoleForm({ ...roleForm, organisation_id: e.target.value })}>
                  <option value="">-- Select Organisation --</option>
                  {orgs.map(o => (
                    <option key={o.organisation_id} value={o.organisation_id}>{o.organisation_name}</option>
                  ))}
                </select>
              </div>
              <div style={inputGroup}>
                <label style={label}>Local Role</label>
                <select style={input} value={roleForm.role_id} onChange={e => setRoleForm({ ...roleForm, role_id: e.target.value })}>
                  <option value="">-- Select Role --</option>
                  {roles.map(r => (
                    <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                  ))}
                </select>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Available roles are defined by the Parent Tenant.</p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
                <button type="button" style={secondaryBtn} onClick={() => setShowRoleModal(false)}>Cancel</button>
                <button type="submit" style={primaryBtn}>Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const container = { padding: "20px", display: "flex", flexDirection: "column", gap: "20px", fontFamily: "Inter, sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const title = { margin: 0, color: "#111827", fontSize: "24px", fontWeight: "700" };
const glassCard = { background: "#fff", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflow: "hidden" };
const table = { width: "100%", borderCollapse: "collapse" };
const tableHeader = { background: "#f8fafc" };
const th = { textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" };
const td = { padding: "16px", fontSize: "14px", color: "#334155", borderBottom: "1px solid #f1f5f9" };
const tr = { transition: "background 0.2s" };
const nameText = { fontWeight: "600", color: "#0f172a", marginBottom: "4px" };
const adminBadge = { background: "#fef08a", color: "#854d0e", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" };
const userBadge = { background: "#e2e8f0", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" };
const primaryBtn = { background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };
const secondaryBtn = { background: "#fff", color: "#3b82f6", border: "1px solid #bfdbfe", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" };
const modalContent = { background: "#fff", padding: "30px", borderRadius: "16px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" };
const modalTitle = { marginTop: 0, fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "#0f172a" };
const form = { display: "flex", flexDirection: "column", gap: "16px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "6px" };
const label = { fontSize: "13px", fontWeight: "600", color: "#475569" };
const input = { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" };