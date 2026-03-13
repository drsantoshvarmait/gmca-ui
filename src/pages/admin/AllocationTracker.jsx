import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Toaster } from "react-hot-toast";

export default function AllocationTracker() {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [stats, setStats] = useState({ total: 0, compliant: 0, gaps: 0 });

    useEffect(() => {
        fetchReport();
    }, []);

    async function fetchReport() {
        setLoading(true);
        const activeOrgId = localStorage.getItem("active_org_id");
        
        let query = supabase
            .from("vw_organisation_compliance_report")
            .select("*")
            .order("department_name", { ascending: true })
            .order("sub_unit_name", { ascending: true });

        if (activeOrgId) {
            query = query.eq("organisation_id", activeOrgId);
        }

        const { data, error } = await query;

        if (!error && data) {
            setReportData(data);
            
            // Calculate stats
            const total = data.length;
            const compliant = data.filter(r => r.status === 'COMPLIANT').length;
            const gaps = total - compliant;
            setStats({ total, compliant, gaps });
        }
        setLoading(false);
    }

    const [editingRow, setEditingRow] = useState(null);
    const [newQty, setNewQty] = useState(0);

    const handleQuickUpdate = async () => {
        if (!editingRow) return;
        
        const { error } = await supabase
            .from("organisation_unit_resource_actuals")
            .upsert({
                organisation_id: editingRow.organisation_id,
                org_sub_unit_id: editingRow.org_sub_unit_id,
                resource_blueprint_id: editingRow.resource_blueprint_id,
                allocated_qty: parseInt(newQty)
            });

        if (error) {
            toast.error("Update failed: " + error.message);
        } else {
            toast.success("Allocation updated for " + editingRow.resource_name);
            setEditingRow(null);
            fetchReport();
        }
    };

    // Grouping by Department
    const departments = [...new Set(reportData.map(r => r.department_name))];

    return (
        <div style={container}>
            <Toaster />
            <div style={header}>
                <div>
                    <h2 style={title}>Allocation & Status Tracker</h2>
                    <p style={subtitle}>NMC MSR vs Actual Resource Allocation Analysis</p>
                </div>
                <div style={statGrid}>
                    <div style={{ ...statCard, borderLeft: '4px solid #3b82f6' }}>
                        <span style={statLabel}>Total Norms</span>
                        <span style={statValue}>{stats.total}</span>
                    </div>
                    <div style={{ ...statCard, borderLeft: '4px solid #10b981' }}>
                        <span style={statLabel}>Compliant</span>
                        <span style={statValue}>{stats.compliant}</span>
                    </div>
                    <div style={{ ...statCard, borderLeft: '4px solid #ef4444' }}>
                        <span style={statLabel}>Shortages (Gaps)</span>
                        <span style={statValue}>{stats.gaps}</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={loadingBox}>Calculating Gaps...</div>
            ) : (
                <div style={content}>
                    {departments.map(dept => (
                        <div key={dept} style={deptSection}>
                            <h3 style={deptTitle}>{dept}</h3>
                            <div style={tableWrap}>
                                <table style={table}>
                                    <thead>
                                        <tr style={thRow}>
                                            <th style={th}>Facility</th>
                                            <th style={th}>Resource Type</th>
                                            <th style={th}>Resource Name</th>
                                            <th style={th} align="center">Required (NMC)</th>
                                            <th style={th} align="center">Allocated (Actual)</th>
                                            <th style={th} align="center">Gap</th>
                                            <th style={th} align="right">Status</th>
                                            <th style={th} align="right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.filter(r => r.department_name === dept).map((row, idx) => (
                                            <tr key={idx} style={rowStyle}>
                                                <td style={td}><b>{row.sub_unit_name}</b></td>
                                                <td style={td}>
                                                    <span style={{ ...typeTag, background: row.resource_type === 'Human' ? '#dbeafe' : row.resource_type === 'Inventory' ? '#f3e8ff' : '#fef3c7' }}>
                                                        {row.resource_type}
                                                    </span>
                                                </td>
                                                <td style={td}>{row.resource_name}</td>
                                                <td style={td} align="center">{row.required_qty}</td>
                                                <td style={td} align="center">{row.allocated_qty}</td>
                                                <td style={{ ...td, color: row.gap < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }} align="center">
                                                    {row.gap > 0 ? `+${row.gap}` : row.gap}
                                                </td>
                                                <td style={td} align="right">
                                                    <span style={{ 
                                                        ...statusTag, 
                                                        background: row.status === 'COMPLIANT' ? '#dcfce7' : row.status === 'NON_COMPLIANT' ? '#fee2e2' : '#fef3c7',
                                                        color: row.status === 'COMPLIANT' ? '#166534' : row.status === 'NON_COMPLIANT' ? '#991b1b' : '#92400e'
                                                    }}>
                                                        {row.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={td} align="right">
                                                    <button 
                                                        style={btnSmall} 
                                                        onClick={() => {
                                                            setEditingRow(row);
                                                            setNewQty(row.allocated_qty);
                                                        }}
                                                    >
                                                        Alloc
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Allocation Modal */}
            {editingRow && (
                <div style={modalOverlay}>
                    <div style={modal}>
                        <h4 style={{ margin: '0 0 20px 0' }}>Quick Allocation: {editingRow.resource_name}</h4>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
                            Update actual quantity for <b>{editingRow.sub_unit_name}</b> in <b>{editingRow.department_name}</b>.
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '800', display: 'block' }}>ALLOCATED QUANTITY</label>
                            <input 
                                type="number" 
                                style={modalInput} 
                                value={newQty}
                                onChange={(e) => setNewQty(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button style={btnGhost} onClick={() => setEditingRow(null)}>Cancel</button>
                            <button style={btnAction} onClick={handleQuickUpdate}>Update Allocation</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const btnSmall = {
    padding: "6px 12px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background 0.2s"
};

const modalOverlay = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.7)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)"
};

const modal = {
    background: "white", padding: "30px", borderRadius: "20px",
    width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
};

const modalInput = {
    width: "100%", padding: "12px", borderRadius: "10px",
    border: "2px solid #e2e8f0", fontSize: "16px", marginTop: "8px", outline: "none"
};

const btnAction = {
    padding: "10px 20px", background: "#3b82f6", color: "white",
    border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer"
};

const btnGhost = {
    padding: "10px 20px", background: "transparent", border: "none",
    color: "#64748b", fontWeight: "700", cursor: "pointer"
};

const container = { padding: "20px", backgroundColor: "#fff", minHeight: "100vh" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" };
const title = { margin: 0, fontSize: "28px", fontWeight: "900", color: "#0f172a" };
const subtitle = { margin: "4px 0 0 0", color: "#64748b", fontSize: "15px" };

const statGrid = { display: "flex", gap: "20px" };
const statCard = { background: "white", padding: "16px 24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", minWidth: "150px" };
const statLabel = { fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "800", letterSpacing: "0.5px" };
const statValue = { fontSize: "24px", fontWeight: "900", color: "#1e293b" };

const content = { display: "flex", flexDirection: "column", gap: "40px" };
const deptSection = { background: "#f8fafc", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0" };
const deptTitle = { margin: "0 0 20px 0", fontSize: "18px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", letterSpacing: "1px" };

const tableWrap = { overflowX: "auto" };
const table = { width: "100%", borderCollapse: "collapse" };
const thRow = { borderBottom: "2px solid #e2e8f0" };
const th = { padding: "12px", fontSize: "11px", color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" };
const td = { padding: "12px", fontSize: "14px", borderBottom: "1px solid #e2e8f0", color: "#334155" };
const rowStyle = { transition: "background 0.2s" };

const typeTag = { padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" };
const statusTag = { padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" };
const loadingBox = { padding: "100px", textAlign: "center", fontSize: "18px", color: "#64748b", fontWeight: "700" };
