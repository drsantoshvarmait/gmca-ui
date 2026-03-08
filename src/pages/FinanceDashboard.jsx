import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Toaster, toast } from "react-hot-toast";

export default function FinanceDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: 0,
        burnRate: 0,
    });
    const [allocations, setAllocations] = useState([]);
    const [recentExpenses, setRecentExpenses] = useState([]);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    async function fetchFinanceData() {
        setLoading(true);
        try {
            // Fetch budget allocations
            const { data: allocData, error: allocError } = await supabase
                .from("finance_allocations")
                .select(`
          *,
          finance_categories (name),
          finance_periods (name)
        `);

            if (allocError) throw allocError;
            setAllocations(allocData || []);

            // Calculate stats
            const total = (allocData || []).reduce((sum, item) => sum + Number(item.amount), 0);

            // Fetch expenses
            const { data: expData, error: expError } = await supabase
                .from("finance_expenses")
                .select(`
          *,
          tasks (title)
        `)
                .order("created_at", { ascending: false })
                .limit(5);

            if (expError) throw expError;
            setRecentExpenses(expData || []);

            const spent = (expData || []).reduce((sum, item) => sum + Number(item.amount), 0);

            setStats({
                totalBudget: total,
                totalSpent: spent,
                remainingBudget: total - spent,
                burnRate: total > 0 ? (spent / total) * 100 : 0
            });

        } catch (error) {
            console.error("Finance fetch error:", error);
            toast.error("Failed to load financial data");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={container}>
            <Toaster position="top-right" />

            <div style={header}>
                <div>
                    <h1 style={title}>Financial Insights</h1>
                    <p style={subtitle}>Monitor allocations and spending across your organization.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button style={secondaryBtn} onClick={() => navigate("/dashboard")}>Back to Home</button>
                    <button style={primaryBtn}>+ Add Allocation</button>
                </div>
            </div>

            {loading ? (
                <div style={loaderContainer}>
                    <div className="animate-pulse" style={loader}>Loading Financial Data...</div>
                </div>
            ) : (
                <>
                    {/* STATS OVERVIEW */}
                    <div style={cardGrid}>
                        <StatCard
                            label="Total Allocated"
                            value={`$${stats.totalBudget.toLocaleString()}`}
                            icon="💰"
                            color="#4f46e5"
                        />
                        <StatCard
                            label="Total Spent"
                            value={`$${stats.totalSpent.toLocaleString()}`}
                            icon="📉"
                            color="#ef4444"
                        />
                        <StatCard
                            label="Remaining"
                            value={`$${stats.remainingBudget.toLocaleString()}`}
                            icon="🛡️"
                            color="#10b981"
                        />
                        <StatCard
                            label="Budget Burn"
                            value={`${stats.burnRate.toFixed(1)}%`}
                            icon="🔥"
                            color="#f59e0b"
                        />
                    </div>

                    <div style={mainGrid}>
                        {/* ALLOCATIONS TABLE */}
                        <div style={glassCard}>
                            <h3 style={cardTitle}>Current Allocations</h3>
                            <table style={table}>
                                <thead>
                                    <tr style={tableHeader}>
                                        <th style={th}>Category</th>
                                        <th style={th}>Period</th>
                                        <th style={th}>Amount</th>
                                        <th style={th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allocations.length === 0 ? (
                                        <tr><td colSpan="4" style={emptyCell}>No allocations found. Start by adding one.</td></tr>
                                    ) : (
                                        allocations.map(alloc => (
                                            <tr key={alloc.id} style={tr}>
                                                <td style={td}>{alloc.finance_categories?.name}</td>
                                                <td style={td}>{alloc.finance_periods?.name}</td>
                                                <td style={td}>${Number(alloc.amount).toLocaleString()}</td>
                                                <td style={td}>
                                                    <span style={statusBadge}>Active</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* RECENT EXPENSES */}
                        <div style={glassCard}>
                            <h3 style={cardTitle}>Recent Expenditures</h3>
                            <div style={expenseList}>
                                {recentExpenses.length === 0 ? (
                                    <p style={emptyText}>No recent expenses recorded.</p>
                                ) : (
                                    recentExpenses.map(exp => (
                                        <div key={exp.id} style={expenseItem}>
                                            <div style={expenseInfo}>
                                                <div style={expenseTitle}>{exp.description || "General Expense"}</div>
                                                <div style={expenseSubtitle}>{exp.tasks?.title || "No linked task"}</div>
                                            </div>
                                            <div style={expenseAmount}>-${Number(exp.amount).toLocaleString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button style={viewAllBtn}>View Expense Log</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    return (
        <div style={statCard}>
            <div style={{ ...iconCircle, backgroundColor: `${color}15`, color: color }}>{icon}</div>
            <div style={statLabel}>{label}</div>
            <div style={statValue}>{value}</div>
        </div>
    );
}

// STYLES
const container = { padding: "40px", backgroundColor: "#f9fafb", minHeight: "100vh" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" };
const title = { fontSize: "32px", fontWeight: "800", color: "#111827", margin: 0 };
const subtitle = { color: "#6b7280", marginTop: "8px" };
const primaryBtn = { backgroundColor: "#4f46e5", color: "white", padding: "12px 24px", borderRadius: "10px", border: "none", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" };
const secondaryBtn = { backgroundColor: "white", color: "#374151", padding: "12px 24px", borderRadius: "10px", border: "1px solid #d1d5db", fontWeight: "600", cursor: "pointer" };
const cardGrid = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "40px" };
const statCard = { backgroundColor: "white", padding: "24px", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "flex-start" };
const iconCircle = { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "16px" };
const statLabel = { color: "#6b7280", fontSize: "14px", fontWeight: "500" };
const statValue = { color: "#111827", fontSize: "24px", fontWeight: "700", marginTop: "4px" };
const mainGrid = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" };
const glassCard = { backgroundColor: "white", padding: "24px", borderRadius: "24px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" };
const cardTitle = { fontSize: "18px", fontWeight: "700", color: "#111827", marginBottom: "20px" };
const table = { width: "100%", borderCollapse: "collapse" };
const tableHeader = { borderBottom: "1px solid #f3f4f6" };
const th = { textAlign: "left", padding: "12px", color: "#6b7280", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" };
const td = { padding: "16px 12px", fontSize: "14px", color: "#374151" };
const tr = { borderBottom: "1px solid #f9fafb" };
const statusBadge = { backgroundColor: "#ecfdf5", color: "#065f46", padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "500" };
const expenseList = { display: "flex", flexDirection: "column", gap: "16px" };
const expenseItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "12px", backgroundColor: "#f9fafb" };
const expenseInfo = { display: "flex", flexDirection: "column" };
const expenseTitle = { fontWeight: "600", color: "#111827", fontSize: "14px" };
const expenseSubtitle = { fontSize: "12px", color: "#6b7280" };
const expenseAmount = { fontWeight: "700", color: "#ef4444", fontSize: "14px" };
const viewAllBtn = { width: "100%", marginTop: "24px", padding: "12px", backgroundColor: "transparent", border: "1px solid #e5e7eb", borderRadius: "10px", color: "#4b5563", fontWeight: "600", cursor: "pointer" };
const loaderContainer = { display: "flex", justifyContent: "center", alignItems: "center", height: "300px" };
const loader = { color: "#6366f1", fontWeight: "600" };
const emptyCell = { textAlign: "center", padding: "40px", color: "#9ca3af" };
const emptyText = { textAlign: "center", color: "#9ca3af", padding: "20px" };
