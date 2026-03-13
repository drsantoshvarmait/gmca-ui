import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

const styles = {
    container: {
        padding: "40px",
        backgroundColor: "#f8fafc",
        minHeight: "100%",
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
    },
    title: {
        fontSize: "24px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
    },
    subTitle: {
        fontSize: "14px",
        color: "#64748b",
        marginTop: "4px",
    },
    btnPrimary: {
        padding: "12px 24px",
        backgroundColor: "#0ea5e9",
        color: "white",
        border: "none",
        borderRadius: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.2)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "24px",
    },
    card: {
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "20px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    cardTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#1e293b",
        margin: "0 0 8px 0",
    },
    cardMeta: {
        fontSize: "13px",
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    badge: {
        padding: "4px 8px",
        backgroundColor: "#f1f5f9",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "700",
        color: "#475569",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
    },
    modal: {
        backgroundColor: "white",
        padding: "32px",
        borderRadius: "24px",
        width: "450px",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
    },
    inputGroup: {
        marginBottom: "20px",
    },
    label: {
        display: "block",
        fontSize: "12px",
        fontWeight: "800",
        color: "#64748b",
        marginBottom: "8px",
        textTransform: "uppercase",
    },
    input: {
        width: "100%",
        padding: "12px",
        borderRadius: "12px",
        border: "2px solid #e2e8f0",
        fontSize: "14px",
        transition: "border-color 0.2s",
        outline: "none",
    },
    footer: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "32px",
    },
    btnGhost: {
        padding: "12px 24px",
        backgroundColor: "transparent",
        color: "#64748b",
        border: "none",
        fontWeight: "700",
        cursor: "pointer",
    }
};

export default function SubUnitMasterManager() {
    const [masters, setMasters] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ sub_unit_name: "", required_area: 0, is_shared_by_default: false });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        const { data } = await supabase.from('master_organisation_sub_units').select('*').order('sub_unit_name');
        setMasters(data || []);
    };

    const handleSubmit = async () => {
        if (!form.sub_unit_name) return toast.error("Name is required");

        const payload = {
            sub_unit_name: form.sub_unit_name,
            required_area: parseFloat(form.required_area),
            is_shared_by_default: form.is_shared_by_default
        };

        let error;
        if (editing) {
            ({ error } = await supabase.from('master_organisation_sub_units').update(payload).eq('id', editing.id));
        } else {
            ({ error } = await supabase.from('master_organisation_sub_units').insert(payload));
        }

        if (error) toast.error(error.message);
        else {
            toast.success(editing ? "Master updated" : "Master created");
            setShowModal(false);
            setEditing(null);
            setForm({ sub_unit_name: "", required_area: 0, is_shared_by_default: false });
            fetchMasters();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will not delete existing spaces, but will remove the blueprint.")) return;
        const { error } = await supabase.from('master_organisation_sub_units').delete().eq('id', id);
        if (error) toast.error(error.message);
        else {
            toast.success("Master deleted");
            fetchMasters();
        }
    };

    return (
        <div style={styles.container}>
            <Toaster />
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Sub-Unit Masters</h1>
                    <p style={styles.subTitle}>Define global blueprints for repeatable spaces (Labs, Halls, Rooms)</p>
                </div>
                <button style={styles.btnPrimary} onClick={() => { setEditing(null); setForm({ sub_unit_name: "", required_area: 0, is_shared_by_default: false }); setShowModal(true); }}>+ New Blueprint</button>
            </div>

            <div style={styles.grid}>
                {masters.map(m => (
                    <div key={m.id} style={styles.card}>
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h3 style={styles.cardTitle}>{m.sub_unit_name}</h3>
                                {m.is_shared_by_default && <span style={{ ...styles.badge, backgroundColor: "#fef3c7", color: "#92400e" }}>SHARED</span>}
                            </div>
                            <div style={styles.cardMeta}>
                                <span style={styles.badge}>{m.required_area} sq.m</span>
                                <span>Blueprint</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button 
                                onClick={() => { setEditing(m); setForm(m); setShowModal(true); }}
                                style={{ color: "#0ea5e9", border: "none", background: "none", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                            >Edit</button>
                            <button 
                                onClick={() => handleDelete(m.id)}
                                style={{ color: "#ef4444", border: "none", background: "none", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                            >Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2 style={{ margin: "0 0 24px 0" }}>{editing ? 'Edit Blueprint' : 'Create New Blueprint'}</h2>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Space Name</label>
                            <input 
                                style={styles.input} 
                                value={form.sub_unit_name}
                                onChange={e => setForm({...form, sub_unit_name: e.target.value})}
                                placeholder="E.g. Biochemistry Lab"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Required Area (SQ.MT)</label>
                            <input 
                                type="number"
                                style={styles.input} 
                                value={form.required_area}
                                onChange={e => setForm({...form, required_area: e.target.value})}
                            />
                        </div>

                        <div style={{ ...styles.inputGroup, display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                            <input 
                                type="checkbox"
                                id="is_shared"
                                checked={form.is_shared_by_default}
                                onChange={e => setForm({...form, is_shared_by_default: e.target.checked})}
                                style={{ width: "18px", height: "18px", cursor: "pointer" }}
                            />
                            <label htmlFor="is_shared" style={{ ...styles.label, margin: 0, cursor: "pointer" }}>Mark as Shared Room by Default</label>
                        </div>

                        <div style={styles.footer}>
                            <button style={styles.btnGhost} onClick={() => setShowModal(false)}>Cancel</button>
                            <button style={styles.btnPrimary} onClick={handleSubmit}>{editing ? 'Save Changes' : 'Create Blueprint'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
