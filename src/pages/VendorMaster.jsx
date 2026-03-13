import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

export default function VendorMaster() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [newVendor, setNewVendor] = useState({
        name: "",
        tax_id: "", // PAN or GSTIN
        website: "",
        is_global: true
    });

    useEffect(() => {
        loadVendors();
    }, []);

    async function loadVendors() {
        try {
            setLoading(true);
            // Fetch vendors linked to this tenant via the junction table
            const { data, error } = await supabase
                .from("proc_tenant_vendors")
                .select(`
                    internal_vendor_code,
                    status,
                    vendors:proc_vendors (
                        vendor_id,
                        name,
                        pan,
                        website
                    )
                `);

            if (error) throw error;
            setVendors(data || []);
        } catch (err) {
            toast.error("Failed to load vendors: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddVendor(e) {
        e.preventDefault();
        try {
            // 1. Create Global Vendor first (or find existing by PAN)
            const { data: globalVendor, error: vError } = await supabase
                .from("proc_vendors")
                .upsert({ name: newVendor.name, pan: newVendor.tax_id, website: newVendor.website })
                .select()
                .single();

            if (vError) throw vError;

            // 2. Link to Tenant
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();

            const { error: linkError } = await supabase
                .from("proc_tenant_vendors")
                .insert({
                    tenant_id: profile.tenant_id,
                    vendor_id: globalVendor.vendor_id,
                    internal_vendor_code: `VEND-${Math.floor(Math.random() * 1000)}`,
                    status: 'ACTIVE'
                });

            if (linkError) throw linkError;

            toast.success("Vendor onboarded successfully! ✅");
            setShowAddModal(false);
            loadVendors();
        } catch (err) {
            toast.error(err.message);
        }
    }

    return (
        <div style={container}>
            <Toaster />
            <div style={header}>
                <div>
                    <button onClick={() => navigate("/procurement")} style={backBtn}>← Procurement</button>
                    <h1 style={title}>Authorized Vendor Master</h1>
                    <p style={subtitle}>Global supplier directory with tenant-specific status and terms.</p>
                </div>
                <button style={primaryBtn} onClick={() => setShowAddModal(true)}>+ Onboard New Vendor</button>
            </div>

            <div style={searchBar}>
                <input
                    type="text"
                    placeholder="Search by Vendor Name, PAN or Internal Code..."
                    style={searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? <p>Loading vendors...</p> : (
                <div style={tableCard}>
                    <table style={table}>
                        <thead>
                            <tr style={tableHeader}>
                                <th style={th}>Internal Code</th>
                                <th style={th}>Vendor Name</th>
                                <th style={th}>Tax ID (PAN)</th>
                                <th style={th}>Website</th>
                                <th style={th}>Compliance Status</th>
                                <th style={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.length === 0 ? (
                                <tr><td colSpan="6" style={emptyCell}>No vendors found. Onboard your first supplier.</td></tr>
                            ) : (
                                vendors.map((v, idx) => (
                                    <tr key={idx} style={tr}>
                                        <td style={{ ...td, fontWeight: '700', color: '#4f46e5' }}>{v.internal_vendor_code}</td>
                                        <td style={{ ...td, fontWeight: '600' }}>{v.vendors?.name}</td>
                                        <td style={td}>{v.vendors?.pan || 'N/A'}</td>
                                        <td style={td}><a href={v.vendors?.website} target="_blank" style={link}>{v.vendors?.website || '-'}</a></td>
                                        <td style={td}>
                                            <span style={{ ...statusBadge, backgroundColor: v.status === 'ACTIVE' ? '#ecfdf5' : '#fee2e2', color: v.status === 'ACTIVE' ? '#059669' : '#dc2626' }}>
                                                {v.status}
                                            </span>
                                        </td>
                                        <td style={td}><button style={viewBtn}>View History</button></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for adding vendors */}
            {showAddModal && (
                <div style={overlay}>
                    <div style={modal}>
                        <h3>Onboard New Supplier</h3>
                        <form onSubmit={handleAddVendor} style={modalForm}>
                            <input placeholder="Company Name" style={modalInput} required onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                            <input placeholder="PAN / GSTIN" style={modalInput} required onChange={e => setNewVendor({ ...newVendor, tax_id: e.target.value })} />
                            <input placeholder="Website (optional)" style={modalInput} onChange={e => setNewVendor({ ...newVendor, website: e.target.value })} />
                            <div style={modalButtons}>
                                <button type="button" style={cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" style={primaryBtn}>Onboard Vendor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// STYLES
const container = { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" };
const backBtn = { background: "none", border: "none", color: "#64748b", fontWeight: "600", cursor: "pointer", marginBottom: "10px", display: "block" };
const title = { fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 };
const subtitle = { color: "#64748b", marginTop: "4px" };
const primaryBtn = { backgroundColor: "#4f46e5", color: "white", padding: "12px 24px", borderRadius: "10px", border: "none", fontWeight: "600", cursor: "pointer" };

const searchBar = { marginBottom: "30px" };
const searchInput = { width: "100%", padding: "14px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", backgroundColor: "white", outline: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };

const tableCard = { backgroundColor: "white", borderRadius: "24px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" };
const table = { width: "100%", borderCollapse: "collapse" };
const tableHeader = { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" };
const th = { textAlign: "left", padding: "16px 20px", color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" };
const td = { padding: "20px", fontSize: "14px", color: "#334155" };
const tr = { borderBottom: "1px solid #f1f5f9" };
const statusBadge = { padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "700" };
const link = { color: "#3b82f6", textDecoration: "none" };
const viewBtn = { background: "#f1f5f9", border: "none", padding: "6px 12px", borderRadius: "8px", color: "#475569", fontWeight: "600", cursor: "pointer" };
const emptyCell = { textAlign: "center", padding: "40px", color: "#94a3b8" };

const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modal = { backgroundColor: "white", padding: "40px", borderRadius: "24px", width: "450px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" };
const modalForm = { display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" };
const modalInput = { padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px" };
const modalButtons = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" };
const cancelBtn = { background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", cursor: "pointer" };
