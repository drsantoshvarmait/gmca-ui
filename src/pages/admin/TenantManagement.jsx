import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"
import { toast, Toaster } from "react-hot-toast"
import MasterSelector from "../../components/admin/MasterSelector"

export default function TenantManagement() {
    const [tenants, setTenants] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newTenant, setNewTenant] = useState({
        tenant_name: "",
        tenant_code: "",
        status: "ACTIVE"
    })
    const [selector, setSelector] = useState({ show: false, entityId: null, type: 'unit' })

    useEffect(() => {
        fetchTenants()
    }, [])

    async function fetchTenants() {
        setLoading(true)
        const { data, error } = await supabase
            .schema("public")
            .from("tenants")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            toast.error("Failed to fetch tenants: " + error.message)
        } else {
            setTenants(data || [])
        }
        setLoading(false)
    }

    async function handleAddTenant(e) {
        e.preventDefault()
        if (!newTenant.tenant_name || !newTenant.tenant_code) {
            toast.error("Please fill in all required fields")
            return
        }

        const { data, error } = await supabase
            .schema("public")
            .from("tenants")
            .insert([newTenant])
            .select()

        if (error) {
            toast.error("Error creating tenant: " + error.message)
        } else {
            toast.success("Tenant created successfully!")
            setTenants([data[0], ...tenants])
            setShowAddModal(false)
            setNewTenant({ tenant_name: "", tenant_code: "", status: "ACTIVE" })
        }
    }

    return (
        <div style={container}>
            <Toaster position="top-right" />

            <div style={header}>
                <h2 style={title}>Tenant Management</h2>
                <button style={primaryBtn} onClick={() => setShowAddModal(true)}>
                    + Create New Tenant
                </button>
            </div>

            <div style={glassCard}>
                {loading ? (
                    <div style={loaderText}>Fetching Tenants...</div>
                ) : (
                    <table style={table}>
                        <thead>
                            <tr style={tableHeader}>
                                <th style={th}>Tenant ID</th>
                                <th style={th}>Code</th>
                                <th style={th}>Name</th>
                                <th style={th}>Status</th>
                                <th style={th}>Masters</th>
                                <th style={th}>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={emptyCell}>No tenants found.</td>
                                </tr>
                            ) : (
                                tenants.map((t) => (
                                    <tr key={t.tenant_id} style={tr}>
                                        <td style={td}>{t.tenant_id.substring(0, 8)}...</td>
                                        <td style={td}>
                                            <span style={codeBadge}>{t.tenant_code}</span>
                                        </td>
                                        <td style={td}>{t.tenant_name}</td>
                                        <td style={td}>
                                            <span style={{
                                                ...statusBadge,
                                                backgroundColor: t.status === 'ACTIVE' ? '#ecfdf5' : '#fff1f2',
                                                color: t.status === 'ACTIVE' ? '#065f46' : '#9f1239'
                                            }}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td style={td}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    style={actionBtn}
                                                    onClick={() => setSelector({ show: true, entityId: t.tenant_id, type: 'unit' })}
                                                >
                                                    Units
                                                </button>
                                                <button 
                                                    style={actionBtn}
                                                    onClick={() => setSelector({ show: true, entityId: t.tenant_id, type: 'sub_unit' })}
                                                >
                                                    Subs
                                                </button>
                                                <button 
                                                    style={actionBtn}
                                                    onClick={() => setSelector({ show: true, entityId: t.tenant_id, type: 'designation' })}
                                                >
                                                    Roles
                                                </button>
                                            </div>
                                        </td>
                                        <td style={td}>{new Date(t.created_at).toLocaleDateString()}</td>
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
                        <h3 style={modalTitle}>Register New Tenant</h3>
                        <form onSubmit={handleAddTenant} style={form}>
                            <div style={inputGroup}>
                                <label style={label}>Tenant Name</label>
                                <input
                                    style={input}
                                    placeholder="e.g. Medical Education Department"
                                    value={newTenant.tenant_name}
                                    onChange={e => setNewTenant({ ...newTenant, tenant_name: e.target.value })}
                                />
                            </div>

                            <div style={inputGroup}>
                                <label style={label}>Tenant Code (Unique)</label>
                                <input
                                    style={input}
                                    placeholder="e.g. MEDD"
                                    value={newTenant.tenant_code}
                                    onChange={e => setNewTenant({ ...newTenant, tenant_code: e.target.value })}
                                />
                            </div>

                            <div style={inputGroup}>
                                <label style={label}>Status</label>
                                <select
                                    style={input}
                                    value={newTenant.status}
                                    onChange={e => setNewTenant({ ...newTenant, status: e.target.value })}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                    <option value="SUSPENDED">SUSPENDED</option>
                                </select>
                            </div>

                            <div style={modalActions}>
                                <button type="button" style={secondaryBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" style={primaryBtn}>Create Tenant</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selector.show && (
                <MasterSelector 
                    level="TENANT"
                    entityId={selector.entityId}
                    masterType={selector.type}
                    onClose={() => setSelector({ ...selector, show: false })}
                />
            )}
        </div>
    )
}

const actionBtn = { background: "#eff6ff", border: "1px solid #dbeafe", color: "#2563eb", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }

const container = { padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }
const header = { display: "flex", justifyContent: "space-between", alignItems: "center" }
const title = { margin: 0, color: "#111827", fontSize: "24px", fontWeight: "700" }
const primaryBtn = { background: "#4f46e5", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }
const secondaryBtn = { background: "#fff", color: "#374151", border: "1px solid #d1d5db", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }
const glassCard = { background: "#fff", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflow: "hidden" }
const table = { width: "100%", borderCollapse: "collapse" }
const tableHeader = { background: "#f9fafb" }
const th = { textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }
const td = { padding: "16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" }
const tr = { transition: "background 0.2s" }
const codeBadge = { background: "#f3f4f6", padding: "4px 8px", borderRadius: "6px", fontFamily: "monospace", fontWeight: "600" }
const statusBadge = { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }
const emptyCell = { textAlign: "center", padding: "40px", color: "#9ca3af" }
const loaderText = { textAlign: "center", padding: "40px", color: "#6366f1", fontWeight: "600" }
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }
const modalContent = { background: "#fff", padding: "32px", borderRadius: "20px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }
const modalTitle = { marginTop: 0, fontSize: "20px", fontWeight: "700", marginBottom: "24px" }
const form = { display: "flex", flexDirection: "column", gap: "16px" }
const inputGroup = { display: "flex", flexDirection: "column", gap: "6px" }
const label = { fontSize: "14px", fontWeight: "600", color: "#374151" }
const input = { padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }
const modalActions = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }
