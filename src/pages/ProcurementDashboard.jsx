import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

export default function ProcurementDashboard() {
    const navigate = useNavigate();
    const { contextCode } = useParams();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingPRs: 5,
        openPOs: 12,
        activeVendors: 42,
        monthlySpend: "₹4.2L"
    });

    const [recentActivites, setRecentActivities] = useState([
        { id: 1, type: "PR", title: "Lab Reagents for Pathology", status: "Pending Approval", amount: "₹45,000", date: "2 mins ago" },
        { id: 2, type: "PO", title: "Hospital Bed Linens", status: "Sent to Vendor", amount: "₹1.2L", date: "1 hour ago" },
        { id: 3, type: "GRN", title: "Surgical Gloves (Batch A)", status: "Received", amount: "₹12,000", date: "3 hours ago" }
    ]);

    return (
        <div style={container}>
            <Toaster position="top-right" />

            {/* Header Section */}
            <div style={header}>
                <div>
                    <h1 style={title}>Procurement Command Center</h1>
                    <p style={subtitle}>Manage requisitions, purchase orders, and vendor ecosystems.</p>
                </div>
                <div style={buttonGroup}>
                    <button style={secondaryBtn} onClick={() => navigate(contextCode ? `/${contextCode}/finance` : "/finance")}>CoA / Finance</button>
                    <button style={primaryBtn} onClick={() => navigate(contextCode ? `/${contextCode}/procurement/new-requisition` : "/procurement/new-requisition")}>+ New Requisition</button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={statsGrid}>
                <StatCard label="Pending Requisitions" value={stats.pendingPRs} icon="📄" color="#6366f1" />
                <StatCard label="Open Purchase Orders" value={stats.openPOs} icon="🛒" color="#10b981" />
                <StatCard label="Authorized Vendors" value={stats.activeVendors} icon="🏢" color="#f59e0b" />
                <StatCard label="Current Month Spend" value={stats.monthlySpend} icon="📉" color="#ef4444" />
            </div>

            {/* Main Content Layout */}
            <div style={mainLayout}>
                {/* Left Column: Explorer */}
                <div style={explorerCard}>
                    <h3 style={sectionTitle}>Procurement Explorer</h3>
                      <div style={menuList}>
                        <MenuLink icon="📦" label="Item Master" description="Statutory item catalog & budget mapping" onClick={() => navigate(contextCode ? `/${contextCode}/procurement/item-master` : "/procurement/item-master")} />
                        <MenuLink icon="🏬" label="Vendor Master" description="Centralized supplier directory" onClick={() => navigate(contextCode ? `/${contextCode}/procurement/vendor-master` : "/procurement/vendor-master")} />
                        <MenuLink icon="📋" label="Purchase Requisitions" description="Manage internal requests" onClick={() => navigate(contextCode ? `/${contextCode}/procurement/new-requisition` : "/procurement/new-requisition")} />
                        <MenuLink icon="🛒" label="Purchase Orders" description="Tracking formal commitments" active />
                        <MenuLink icon="🚚" label="Goods Receipt (GRN)" description="Inventory intake & QC" onClick={() => navigate(contextCode ? `/${contextCode}/procurement/goods-receipt` : "/procurement/goods-receipt")} />
                        <MenuLink icon="🔢" label="CoA Master" description="Standard statutory heads" onClick={() => navigate(contextCode ? `/${contextCode}/finance/coa` : "/finance/coa")} />
                    </div>
                </div>

                {/* Right Column: Recent Activity */}
                <div style={activityCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={sectionTitle}>Live Activity Stream</h3>
                        <button style={textBtn}>View Audit Trail</button>
                    </div>

                    <div style={activityList}>
                        {recentActivites.map(item => (
                            <div key={item.id} style={activityItem}>
                                <div style={{ ...activityMarker, backgroundColor: item.type === "PR" ? "#6366f1" : item.type === "PO" ? "#10b981" : "#f59e0b" }}>
                                    {item.type}
                                </div>
                                <div style={activityContent}>
                                    <div style={activityTitle}>{item.title}</div>
                                    <div style={activityMeta}>
                                        <span style={statusText}>{item.status}</span>
                                        <span style={dot}>•</span>
                                        <span>{item.amount}</span>
                                        <span style={dot}>•</span>
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                                <button style={actionBtn}>Details</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-components for cleaner code
function StatCard({ label, value, icon, color }) {
    return (
        <div style={statCard}>
            <div style={{ ...iconCircle, backgroundColor: `${color}15`, color: color }}>{icon}</div>
            <div style={statInfo}>
                <div style={statLabel}>{label}</div>
                <div style={statValue}>{value}</div>
            </div>
        </div>
    );
}

function MenuLink({ icon, label, description, active, onClick }) {
    return (
        <div style={{ ...menuItem, backgroundColor: active ? "#f1f5f9" : "transparent" }} onClick={onClick}>
            <div style={menuIcon}>{icon}</div>
            <div style={menuText}>
                <div style={{ ...menuLabel, fontWeight: active ? "700" : "500" }}>{label}</div>
                <div style={menuDescription}>{description}</div>
            </div>
        </div>
    );
}

// STYLES
const container = { padding: "40px", backgroundColor: "#f9fafb", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" };
const title = { fontSize: "32px", fontWeight: "800", color: "#111827", margin: 0, letterSpacing: "-0.5px" };
const subtitle = { color: "#6b7280", marginTop: "8px", fontSize: "16px" };
const buttonGroup = { display: "flex", gap: "12px" };
const primaryBtn = { backgroundColor: "#4f46e5", color: "white", padding: "12px 24px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)" };
const secondaryBtn = { backgroundColor: "white", color: "#374151", padding: "12px 24px", borderRadius: "12px", border: "1px solid #e5e7eb", fontWeight: "600", cursor: "pointer" };

const statsGrid = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "40px" };
const statCard = { backgroundColor: "white", padding: "24px", borderRadius: "24px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" };
const iconCircle = { width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" };
const statInfo = { display: "flex", flexDirection: "column" };
const statLabel = { color: "#6b7280", fontSize: "14px", fontWeight: "500" };
const statValue = { color: "#111827", fontSize: "24px", fontWeight: "800", marginTop: "2px" };

const mainLayout = { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" };
const explorerCard = { backgroundColor: "white", padding: "30px", borderRadius: "32px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" };
const activityCard = { backgroundColor: "white", padding: "30px", borderRadius: "32px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" };
const sectionTitle = { fontSize: "20px", fontWeight: "700", color: "#1f2937", margin: "0 0 24px 0" };

const menuList = { display: "flex", flexDirection: "column", gap: "8px" };
const menuItem = { display: "flex", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "20px", cursor: "pointer", transition: "all 0.2s" };
const menuIcon = { fontSize: "24px" };
const menuText = { display: "flex", flexDirection: "column" };
const menuLabel = { fontSize: "15px", color: "#1f2937" };
const menuDescription = { fontSize: "12px", color: "#6b7280", marginTop: "2px" };

const activityList = { display: "flex", flexDirection: "column", gap: "16px" };
const activityItem = { display: "flex", alignItems: "center", gap: "16px", padding: "20px", borderRadius: "20px", backgroundColor: "#f9fafb", transition: "transform 0.2s" };
const activityMarker = { padding: "4px 10px", borderRadius: "8px", color: "white", fontSize: "11px", fontWeight: "800" };
const activityContent = { flex: 1 };
const activityTitle = { fontWeight: "600", color: "#111827", fontSize: "15px" };
const activityMeta = { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280", marginTop: "4px" };
const statusText = { color: "#4f46e5", fontWeight: "600" };
const dot = { color: "#d1d5db" };
const actionBtn = { backgroundColor: "white", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", color: "#374151", cursor: "pointer" };
const textBtn = { background: "none", border: "none", color: "#4f46e5", fontWeight: "600", cursor: "pointer", fontSize: "14px" };
