import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";

const MASTER_TABLES = {
    designations: {
        label: "Designations",
        table: "designations",
        idCol: "designation_id",
        nameCol: "designation_name",
        rpc: "merge_designations",
        references: [
            { table: "employees", col: "designation_id", label: "Active Employees" },
            { table: "sop_step", col: "designation_id", label: "Workflow Steps" },
            { table: "org_type_designations", col: "designation_id", label: "Permitted Org Types" },
            { table: "core_person_designation_assignment", col: "designation_title_id", label: "Person Assignments" }
        ]
    },
    org_types: {
        label: "Organisation Types",
        table: "organisation_types",
        idCol: "organisation_type_id",
        nameCol: "organisation_type",
        rpc: "merge_organisation_types",
        references: [
            { table: "organisations", col: "organisation_type_id", label: "Linked Organisations" },
            { table: "org_type_designations", col: "organisation_type_id", label: "Designation Mappings" },
            { table: "department_templates", col: "organisation_type_id", label: "Department Templates" }
        ]
    },
    districts: {
        label: "Districts",
        table: "districts",
        idCol: "district_id",
        nameCol: "district_name",
        rpc: null,
        references: [
            { table: "locations", col: "district_code", label: "Locations/Villages" }
        ]
    },
    departments: {
        label: "Departments",
        table: "departments",
        idCol: "department_id",
        nameCol: "department_name",
        rpc: null,
        references: [
            { table: "employees", col: "department_id", label: "Employees" },
            { table: "organisation_departments", col: "department_template_id", label: "Org Depts" }
        ]
    }
};

export default function MasterDataCleanup() {
    const [selectedTableKey, setSelectedTableKey] = useState("designations");
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);

    // Merge State
    const [sourceId, setSourceId] = useState("");
    const [targetId, setTargetId] = useState("");

    // Delete State
    const [deleteId, setDeleteId] = useState("");
    const [usageStats, setUsageStats] = useState(null);
    const [scanning, setScanning] = useState(false);

    const currentTable = MASTER_TABLES[selectedTableKey];

    useEffect(() => {
        loadItems();
    }, [selectedTableKey]);

    async function loadItems() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from(currentTable.table)
                .select(`*`)
                .order(currentTable.nameCol);

            if (error) throw error;
            setItems(data || []);
            setSourceId("");
            setTargetId("");
            setDeleteId("");
            setUsageStats(null);
        } catch (e) {
            toast.error(`Error loading ${currentTable.label}: ` + e.message);
        } finally {
            setLoading(false);
        }
    }

    const scanUsage = async (id) => {
        if (!id) {
            setUsageStats(null);
            return;
        }
        try {
            setScanning(true);
            const stats = {};
            const refs = currentTable.references || [];
            for (const ref of refs) {
                const { count, error } = await supabase
                    .from(ref.table)
                    .select('*', { count: 'exact', head: true })
                    .eq(ref.col, id);
                if (!error) stats[ref.label] = count || 0;
            }
            setUsageStats(stats);
        } catch (e) {
            console.error("Scanning error", e);
        } finally {
            setScanning(false);
        }
    };

    const handleMerge = async () => {
        if (!sourceId || !targetId) {
            toast.error("Select both source and target!");
            return;
        }
        if (sourceId === targetId) {
            toast.error("Source and target must be different!");
            return;
        }

        const sourceName = items.find(i => i[currentTable.idCol] === sourceId)?.[currentTable.nameCol];
        const targetName = items.find(i => i[currentTable.idCol] === targetId)?.[currentTable.nameCol];

        if (!window.confirm(`MERGE CRITICAL ACTION: \nMove all associations from '${sourceName}' → '${targetName}'? \n\nThis will permanently DELETE '${sourceName}'. \nContinue?`)) return;

        try {
            setLoading(true);
            if (!currentTable.rpc) {
                throw new Error(`Merge RPC not implemented for ${currentTable.label} yet.`);
            }

            const { error } = await supabase.rpc(currentTable.rpc, {
                source_id: sourceId,
                target_id: targetId
            });

            if (error) throw error;

            toast.success(`Successfully merged items!`);
            await loadItems();
        } catch (e) {
            toast.error("Merge Failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const itemName = items.find(i => i[currentTable.idCol] === deleteId)?.[currentTable.nameCol];

        const totalUsage = usageStats ? Object.values(usageStats).reduce((a, b) => a + b, 0) : 0;
        if (totalUsage > 0) {
            toast.error("Blocked: Record is in use. Merge it into a target instead.");
            return;
        }

        if (!window.confirm(`Permanently delete '${itemName}'? \n\nThis action is irreversible.`)) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from(currentTable.table)
                .delete()
                .eq(currentTable.idCol, deleteId);

            if (error) {
                if (error.code === '23503') {
                    toast.error("Cannot delete: This entry is referenced by other records. Use 'Merge' to reallocate them first.");
                } else {
                    throw error;
                }
            } else {
                toast.success(`Deleted '${itemName}' successfully.`);
                await loadItems();
            }
        } catch (e) {
            toast.error("Delete Failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={container}>
            <Toaster />
            <div style={header}>
                <div>
                    <h2 style={title}>Master Data Control Hub</h2>
                    <p style={subtitle}>Global deduplication and safe cleanup for system-wide taxonomy.</p>
                </div>
            </div>

            {/* Sidebar-like Table Selector */}
            <div style={tabStrip}>
                {Object.keys(MASTER_TABLES).map(key => (
                    <button
                        key={key}
                        onClick={() => setSelectedTableKey(key)}
                        style={selectedTableKey === key ? activeTab : inactiveTab}
                    >
                        {MASTER_TABLES[key].label}
                    </button>
                ))}
            </div>

            <div style={grid}>
                {/* MERGE SECTION */}
                <div style={card}>
                    <div style={cardHeader}>
                        <h3 style={cardTitle}>Deduplication & Merge</h3>
                        <span style={pillBadgeBlue}>Recommended</span>
                    </div>
                    <p style={cardDesc}>
                        Safely combine two entries into one. All employees, workflows, and historical data pointing to the "Duplicate" will be moved to the "Target".
                    </p>

                    <div style={formGroup}>
                        <label style={label}>1. Select Wrong / Duplicate Entry</label>
                        <Select
                            placeholder="Search entry to delete..."
                            options={items.map(i => ({ value: i[currentTable.idCol], label: i[currentTable.nameCol] }))}
                            value={sourceId ? { value: sourceId, label: items.find(i => i[currentTable.idCol] === sourceId)?.[currentTable.nameCol] } : null}
                            onChange={(opt) => setSourceId(opt?.value || "")}
                            styles={customSelectStyles('#fca5a5', '#fef2f2')}
                        />
                    </div>

                    <div style={divider}>
                        <span style={dividerText}>MOVES INTO</span>
                    </div>

                    <div style={formGroup}>
                        <label style={label}>2. Select Correct / Target Entry</label>
                        <Select
                            placeholder="Search entry to keep..."
                            options={items.map(i => ({ value: i[currentTable.idCol], label: i[currentTable.nameCol] }))}
                            value={targetId ? { value: targetId, label: items.find(i => i[currentTable.idCol] === targetId)?.[currentTable.nameCol] } : null}
                            onChange={(opt) => setTargetId(opt?.value || "")}
                            styles={customSelectStyles('#86efac', '#f0fdf4')}
                        />
                    </div>

                    <button
                        style={{ ...primaryBtn, opacity: (sourceId && targetId && !loading) ? 1 : 0.5 }}
                        onClick={handleMerge}
                        disabled={!sourceId || !targetId || loading}
                    >
                        {loading ? "Processing..." : "Execute Global Merge"}
                    </button>
                    {!currentTable.rpc && <p style={warningText}>⚠ Merge logic not yet fully implemented for this table.</p>}
                </div>

                {/* DANGER ZONE - DIRECT DELETE */}
                <div style={cardRed}>
                    <div style={cardHeader}>
                        <h3 style={{ ...cardTitle, color: "#991b1b" }}>Danger Zone</h3>
                        <span style={pillBadgeRed}>Destructive</span>
                    </div>
                    <p style={{ ...cardDesc, color: "#991b1b99" }}>
                        Permanently remove entries that were created by mistake and have NO active associations.
                    </p>

                    <div style={formGroup}>
                        <label style={{ ...label, color: "#991b1b" }}>Select Entry to Wipe</label>
                        <Select
                            placeholder="Search entry to wipe..."
                            options={items.map(i => ({ value: i[currentTable.idCol], label: i[currentTable.nameCol] }))}
                            value={deleteId ? { value: deleteId, label: items.find(i => i[currentTable.idCol] === deleteId)?.[currentTable.nameCol] } : null}
                            onChange={(opt) => {
                                setDeleteId(opt?.value || "");
                                scanUsage(opt?.value);
                            }}
                            styles={customSelectStyles('#ef4444', '#fff1f2')}
                        />
                    </div>

                    {scanning && <p style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold' }}>Scanning for dependencies...</p>}

                    {usageStats && (
                        <div style={usageBox}>
                            <h4 style={usageBoxTitle}>Allocation Summary</h4>
                            <div style={usageGrid}>
                                {Object.entries(usageStats).map(([label, count]) => (
                                    <div key={label} style={usageItem}>
                                        <span style={usageLabel}>{label}:</span>
                                        <span style={count > 0 ? usageCountActive : usageCountZero}>{count}</span>
                                    </div>
                                ))}
                            </div>
                            {Object.values(usageStats).some(c => c > 0) && (
                                <p style={usageWarning}>⚠ This entry is active and cannot be deleted. Link it to a target using the Merge tool.</p>
                            )}
                        </div>
                    )}

                    <p style={noteText}>
                        * The system will automatically block deletion if this entry is tied to an active employee or workflow.
                    </p>

                    <button
                        style={dangerBtn}
                        onClick={handleDelete}
                        disabled={!deleteId || loading}
                    >
                        {loading ? "Deleting..." : "Direct System Delete"}
                    </button>
                </div>
            </div>

            <div style={footer}>
                <p>System Maintenance Mode: Use with caution. Changes are audited.</p>
            </div>
        </div>
    );
}

// STYLES
const container = { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100%", fontFamily: "'Inter', sans-serif" };
const header = { marginBottom: "32px" };
const title = { margin: 0, fontSize: "28px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" };
const subtitle = { margin: "8px 0 0 0", fontSize: "16px", color: "#64748b" };

const tabStrip = { display: "flex", gap: "8px", marginBottom: "32px", borderBottom: "1px solid #e2e8f0", paddingBottom: "1px" };
const baseTab = { padding: "12px 24px", border: "none", background: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.2s" };
const activeTab = { ...baseTab, color: "#2563eb", borderBottom: "2px solid #2563eb" };
const inactiveTab = { ...baseTab, color: "#64748b" };

const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" };
const card = { backgroundColor: "white", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" };
const cardRed = { ...card, border: "2px dashed #fca5a5", backgroundColor: "#fff" };

const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const cardTitle = { margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a" };
const cardDesc = { fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", lineHeight: "1.6" };

const pillBadgeBlue = { backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" };
const pillBadgeRed = { backgroundColor: "#fee2e2", color: "#ef4444", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" };

const formGroup = { marginBottom: "20px" };
const label = { display: "block", fontSize: "12px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" };

const divider = { display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", position: "relative" };
const dividerText = { backgroundColor: "white", padding: "0 10px", color: "#94a3b8", fontSize: "10px", fontWeight: "800", zIndex: 1 };

const primaryBtn = { width: "100%", background: "#0f172a", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", cursor: "pointer", marginTop: "12px" };
const dangerBtn = { ...primaryBtn, background: "#ef4444" };

const noteText = { fontSize: "12px", color: "#9ca3af", fontStyle: "italic", margin: "16px 0" };
const warningText = { fontSize: "12px", color: "#d97706", marginTop: "12px", textAlign: "center", fontWeight: "600" };
const usageBox = { backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginTop: "16px" };
const usageBoxTitle = { margin: "0 0 12px 0", fontSize: "12px", fontWeight: "800", color: "#475569", textTransform: "uppercase" };
const usageGrid = { display: "flex", flexDirection: "column", gap: "8px" };
const usageItem = { display: "flex", justifyContent: "space-between", fontSize: "13px" };
const usageLabel = { color: "#64748b" };
const usageCountActive = { fontWeight: "700", color: "#ef4444" };
const usageCountZero = { color: "#94a3b8" };
const usageWarning = { fontSize: "11px", color: "#b91c1c", marginTop: "12px", fontWeight: "600", lineHeight: "1.4" };
const footer = { marginTop: "60px", textAlign: "center", color: "#94a3b8", fontSize: "12px" };

const customSelectStyles = (borderColor, bgColor) => ({
    control: (base, state) => ({
        ...base,
        borderRadius: '12px',
        borderColor: state.isFocused ? borderColor : '#e2e8f0',
        backgroundColor: state.isFocused ? bgColor : 'white',
        padding: '2px',
        fontSize: '14px',
        boxShadow: state.isFocused ? `0 0 0 4px ${borderColor}22` : 'none',
        '&:hover': { borderColor }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? borderColor : state.isFocused ? bgColor : 'transparent',
        color: state.isSelected ? 'white' : '#1e293b',
        fontSize: '14px'
    })
});
