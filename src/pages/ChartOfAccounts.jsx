import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

export default function ChartOfAccounts() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadCoA();
    }, []);

    async function loadCoA() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("fin_coa")
                .select("*")
                .order("full_account_code", { ascending: true });

            if (error) throw error;
            setAccounts(data || []);
        } catch (err) {
            toast.error("Failed to load Chart of Accounts: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    const filteredAccounts = accounts.filter(acc =>
        acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.local_account_name && acc.local_account_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        acc.full_account_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={container}>
            <Toaster />
            <div style={header}>
                <div>
                    <button onClick={() => navigate("/procurement")} style={backBtn}>← Back to Procurement</button>
                    <h1 style={title}>Chart of Accounts (CoA Master)</h1>
                    <p style={subtitle}>Statutory heads as per CAG/AG Medical Education standards.</p>
                </div>
                <div style={buttonGroup}>
                    <button style={secondaryBtn} onClick={loadCoA}>↻ Refresh</button>
                    <button style={primaryBtn}>+ Add New Head</button>
                </div>
            </div>

            <div style={filterBar}>
                <input
                    type="text"
                    placeholder="Search by Head Name or Full Code (e.g., 2210-05)..."
                    style={searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={loaderCell}>Fetching Statutory Master...</div>
            ) : (
                <div style={tableCard}>
                    <table style={table}>
                        <thead>
                            <tr style={tableHeader}>
                                <th style={th}>Full Account Code</th>
                                <th style={th}>Head Description</th>
                                <th style={th}>Type</th>
                                <th style={th}>Tax / AG Tag</th>
                                <th style={th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.length === 0 ? (
                                <tr><td colSpan="5" style={emptyCell}>No accounts found for this tenant.</td></tr>
                            ) : (
                                filteredAccounts.map((acc, idx) => (
                                    <tr key={idx} style={tr}>
                                        <td style={{ ...td, fontFamily: 'Monaco, monospace', fontWeight: '700', color: '#4f46e5' }}>
                                            {acc.full_account_code}
                                        </td>
                                        <td style={{ ...td }}>
                                            <div style={{ fontWeight: '700', color: '#111827' }}>{acc.account_name}</div>
                                            {acc.local_account_name && (
                                                <div style={{ fontSize: '15px', color: '#6366f1', marginTop: '2px', fontWeight: '500' }}>{acc.local_account_name}</div>
                                            )}
                                        </td>
                                        <td style={td}>
                                            <span style={{ ...typeBadge, backgroundColor: acc.account_type === 'EXPENSE' ? '#fef2f2' : '#ecfdf5', color: acc.account_type === 'EXPENSE' ? '#991b1b' : '#065f46' }}>
                                                {acc.account_type}
                                            </span>
                                        </td>
                                        <td style={td}><code style={code}>{acc.tax_audit_tag || 'Standard'}</code></td>
                                        <td style={td}>
                                            <span style={{ ...statusDot, backgroundColor: acc.is_active ? '#10b981' : '#d1d5db' }}></span>
                                            {acc.is_active ? 'Active' : 'Inactive'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// STYLES
const container = { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" };
const backBtn = { background: "none", border: "none", color: "#6366f1", fontWeight: "700", cursor: "pointer", marginBottom: "8px", padding: 0 };
const title = { fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-1px" };
const subtitle = { color: "#64748b", marginTop: "4px", fontSize: "15px" };
const buttonGroup = { display: "flex", gap: "12px" };
const primaryBtn = { backgroundColor: "#4f46e5", color: "white", padding: "12px 24px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer" };
const secondaryBtn = { backgroundColor: "white", color: "#475569", padding: "12px 24px", borderRadius: "12px", border: "1px solid #e2e8f0", fontWeight: "600", cursor: "pointer" };

const filterBar = { marginBottom: "30px" };
const searchInput = { width: "100%", padding: "16px 24px", borderRadius: "20px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "15px", outline: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };

const tableCard = { backgroundColor: "white", borderRadius: "28px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)" };
const table = { width: "100%", borderCollapse: "collapse" };
const tableHeader = { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" };
const th = { textAlign: "left", padding: "16px 24px", color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" };
const td = { padding: "20px 24px", fontSize: "14px", color: "#334155" };
const tr = { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" };
const typeBadge = { padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "700" };
const code = { backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", color: "#475569" };
const statusDot = { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", marginRight: "8px" };
const loaderCell = { textAlign: "center", padding: "100px", color: "#6366f1", fontWeight: "600" };
const emptyCell = { textAlign: "center", padding: "60px", color: "#94a3b8" };
