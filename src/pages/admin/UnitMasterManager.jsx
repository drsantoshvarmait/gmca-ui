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
        boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.2)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px",
    },
    card: {
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "20px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#1e293b",
        margin: 0,
    },
    cardSub: {
        fontSize: "12px",
        color: "#94a3b8",
        marginTop: "4px",
    },
    badge: {
        padding: "4px 10px",
        backgroundColor: "#f0fdf4",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "700",
        color: "#166534",
        letterSpacing: "0.05em",
    },
    actions: {
        display: "flex",
        gap: "12px",
    },
    btnLink: (color) => ({
        color,
        border: "none",
        background: "none",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "13px",
        padding: 0,
    }),
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
    modalTitle: {
        margin: "0 0 24px 0",
        fontSize: "20px",
        fontWeight: "800",
        color: "#0f172a",
    },
    label: {
        display: "block",
        fontSize: "12px",
        fontWeight: "800",
        color: "#64748b",
        marginBottom: "8px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    input: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "2px solid #e2e8f0",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
    },
    inputGroup: { marginBottom: "20px" },
    footer: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "28px",
    },
    btnGhost: {
        padding: "12px 20px",
        backgroundColor: "transparent",
        color: "#64748b",
        border: "none",
        fontWeight: "700",
        cursor: "pointer",
    },
    emptyState: {
        textAlign: "center",
        padding: "60px 20px",
        color: "#94a3b8",
    }
};

export default function UnitMasterManager() {
    const [masters, setMasters] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ unit_name: "", description: "" });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        const { data, error } = await supabase
            .from('master_organisation_units')
            .select('*')
            .order('unit_name');
        if (error) toast.error(error.message);
        setMasters(data || []);
    };

    const openModal = (item = null) => {
        setEditing(item);
        setForm(item ? { unit_name: item.unit_name, description: item.description || "" } : { unit_name: "", description: "" });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.unit_name.trim()) return toast.error("Unit name is required");

        const payload = {
            unit_name: form.unit_name.trim(),
            description: form.description.trim() || null,
        };

        let error;
        if (editing) {
            ({ error } = await supabase.from('master_organisation_units').update(payload).eq('id', editing.id));
        } else {
            ({ error } = await supabase.from('master_organisation_units').insert(payload));
        }

        if (error) toast.error(error.message);
        else {
            toast.success(editing ? "Unit Master updated" : "Unit Master created");
            setShowModal(false);
            fetchMasters();
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}" from Unit Masters? This won't affect existing units.`)) return;
        const { error } = await supabase.from('master_organisation_units').delete().eq('id', id);
        if (error) toast.error(error.message);
        else {
            toast.success("Deleted");
            fetchMasters();
        }
    };

    return (
        <div style={styles.container}>
            <Toaster />

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Unit Masters</h1>
                    <p style={styles.subTitle}>Define standard department templates (pre-fill when adding a unit to any Org Type)</p>
                </div>
                <button style={styles.btnPrimary} onClick={() => openModal()}>+ New Unit Master</button>
            </div>

            {/* Grid */}
            {masters.length === 0 ? (
                <div style={styles.emptyState}>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>No Unit Masters yet</p>
                    <p>Click "+ New Unit Master" to define your first department blueprint.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {masters.map(m => (
                        <div key={m.id} style={styles.card}>
                            <div>
                                <p style={styles.cardTitle}>{m.unit_name}</p>
                                {m.description && <p style={styles.cardSub}>{m.description}</p>}
                            </div>
                            <div>
                                <span style={styles.badge}>UNIT</span>
                                <div style={{ ...styles.actions, marginTop: "10px" }}>
                                    <button style={styles.btnLink("#0ea5e9")} onClick={() => openModal(m)}>Edit</button>
                                    <button style={styles.btnLink("#ef4444")} onClick={() => handleDelete(m.id, m.unit_name)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2 style={styles.modalTitle}>{editing ? "Edit Unit Master" : "New Unit Master"}</h2>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Department / Unit Name</label>
                            <input
                                style={styles.input}
                                value={form.unit_name}
                                onChange={e => setForm({ ...form, unit_name: e.target.value })}
                                placeholder="E.g. Cardiology Department"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Description (Optional)</label>
                            <input
                                style={styles.input}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="E.g. Covers cardiac care, ICU, cath lab..."
                            />
                        </div>

                        <div style={styles.footer}>
                            <button style={styles.btnGhost} onClick={() => setShowModal(false)}>Cancel</button>
                            <button style={styles.btnPrimary} onClick={handleSubmit}>
                                {editing ? "Save Changes" : "Create Master"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
