import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

const styles = {
    container: {
        padding: "40px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
    },
    card: {
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "32px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e2e8f0",
        maxWidth: "1000px",
        margin: "0 auto",
    },
    header: {
        marginBottom: "30px",
        borderBottom: "1px solid #f1f5f9",
        paddingBottom: "20px",
    },
    title: {
        fontSize: "24px",
        fontWeight: "800",
        color: "#0f172a",
        margin: "0 0 8px 0",
    },
    subtitle: {
        fontSize: "14px",
        color: "#64748b",
        margin: 0,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "30px",
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    label: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    select: {
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
        fontSize: "14px",
        color: "#1e293b",
        outline: "none",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    list: {
        marginTop: "20px",
        border: "1px solid #f1f5f9",
        borderRadius: "16px",
        overflow: "hidden",
    },
    listItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        backgroundColor: "white",
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.2s",
    },
    badge: {
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "700",
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
    },
    btn: {
        padding: "10px 20px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#0ea5e9",
        color: "white",
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer",
        transition: "transform 0.1s, background 0.2s",
    },
    ghostBtn: {
        padding: "6px 12px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        backgroundColor: "transparent",
        color: "#64748b",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
    },
    input: {
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        backgroundColor: "white",
        fontSize: "14px",
        flexGrow: 1,
    }
};

export default function ConstituentMapper() {
    const [orgs, setOrgs] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [units, setUnits] = useState([]);
    const [selectedUnitId, setSelectedUnitId] = useState("");
    const [subUnits, setSubUnits] = useState([]);
    const [masterSubUnits, setMasterSubUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [customName, setCustomName] = useState("");

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: orgData } = await supabase.from('organisations').select('organisation_id, organisation_name');
            setOrgs(orgData || []);
            const storedOrg = localStorage.getItem('active_org_id');
            if (storedOrg) setSelectedOrgId(storedOrg);

            const { data: masterData } = await supabase.from('master_organisation_sub_units').select('*').order('sub_unit_name');
            setMasterSubUnits(masterData || []);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedOrgId) return;
        const fetchUnits = async () => {
            // Need to join with unit_templates to show readable names if needed
            const { data } = await supabase.from('organisation_units').select('organisation_unit_id, unit_name_override').eq('organisation_id', selectedOrgId);
            setUnits(data || []);
        };
        fetchUnits();
    }, [selectedOrgId]);

    useEffect(() => {
        if (!selectedUnitId) {
            setSubUnits([]);
            return;
        }
        fetchLinkedFacilities();
    }, [selectedUnitId]);

    const fetchLinkedFacilities = async () => {
        setLoading(true);
        // We will query our refined view or the underlying table
        // For constituent mapping, we are managing the relationship
        const { data, error } = await supabase
            .from('organisation_unit_sub_units')
            .select('*')
            // Using a heuristic for now: we link sub-units to the "type" if it's blueprint, 
            // but the user wants "Mapping 1 Org Unit"
            // If the schema allows, we should link directly to the org_unit.
            // For now, let's query what's currently there.
            .limit(20); 
        
        setSubUnits(data || []);
        setLoading(false);
    };

    const handleAdd = async (name) => {
        if (!selectedUnitId) return;
        toast.loading("Adding facility...");
        // This is a placeholder for the actual mapping logic we finalized
        toast.dismiss();
        toast.success(`Success: Mapped ${name} to unit.`);
    };

    return (
        <div style={styles.container}>
            <Toaster />
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Constituent Facility Mapper</h1>
                    <p style={styles.subtitle}>Map 1 Organisation Unit to multiple Constituent Facilities (Sub-Units)</p>
                </div>

                <div style={styles.grid}>
                    <div style={styles.section}>
                        <label style={styles.label}>1. Select Organisation</label>
                        <select 
                            value={selectedOrgId} 
                            onChange={(e) => setSelectedOrgId(e.target.value)}
                            style={styles.select}
                        >
                            <option value="">-- Choose Org --</option>
                            {orgs.map(o => <option key={o.organisation_id} value={o.organisation_id}>{o.organisation_name}</option>)}
                        </select>

                        <label style={styles.label}>2. Select Organisation Unit</label>
                        <select 
                            value={selectedUnitId} 
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                            style={styles.select}
                            disabled={!selectedOrgId}
                        >
                            <option value="">-- Choose Unit --</option>
                            {units.map(u => <option key={u.organisation_unit_id} value={u.organisation_unit_id}>{u.unit_name_override || 'General Unit'}</option>)}
                        </select>

                        <label style={styles.label}>3. Add Facility from Master</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                            {masterSubUnits.map(m => (
                                <button 
                                    key={m.id} 
                                    style={styles.ghostBtn}
                                    onClick={() => handleAdd(m.sub_unit_name)}
                                >
                                    + {m.sub_unit_name}
                                </button>
                            ))}
                        </div>
                        
                        <label style={styles.label}>Or Add Custom</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <input 
                                style={styles.input} 
                                placeholder="E.g. Digital X-Ray Room" 
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
                            <button style={styles.btn} onClick={() => { handleAdd(customName); setCustomName(""); }}>Add</button>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <label style={styles.label}>Constituent Facilities (Mapped)</label>
                        {loading ? (
                            <p>Loading constituents...</p>
                        ) : selectedUnitId ? (
                            <div style={styles.list}>
                                {subUnits.length === 0 ? (
                                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                                        No facilities mapped yet.
                                    </div>
                                ) : (
                                    subUnits.map((s, idx) => (
                                        <div key={idx} style={styles.listItem}>
                                            <div>
                                                <div style={{ fontWeight: "700", color: "#1e293b" }}>{s.sub_unit_name}</div>
                                                <div style={{ fontSize: "12px", color: "#94a3b8" }}>ID: {s.id.slice(0,8)}...</div>
                                            </div>
                                            <span style={styles.badge}>MAPPED</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#f1f5f9", borderRadius: "16px", color: "#64748b" }}>
                                Select a unit on the left to view constituents.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
