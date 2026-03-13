import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";
const ITEM_CATEGORIES = [
    "Furniture", 
    "Equipment (Medical)", 
    "Equipment (General)", 
    "Stationery", 
    "Drugs/Medicines", 
    "Surgical Consumables", 
    "Lab Reagents", 
    "Printing", 
    "IT/Computer", 
    "Maintenance/Store",
    "Others"
];
export default function ItemMaster() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [subObjectives, setSubObjectives] = useState([]);
    const [categories, setCategories] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQuickAddCat, setShowQuickAddCat] = useState(false);
    const [showQuickAddUom, setShowQuickAddUom] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newCatName, setNewCatName] = useState("");
    const [newUomName, setNewUomName] = useState("");
    const [newItem, setNewItem] = useState({
        item_name: "",
        item_code: "",
        unit_of_measure: "Nos",
        subobjective_id: "",
        category_id: ""
    });
    useEffect(() => {
        loadData();
    }, []);
    async function loadData() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            // Fetch Tenant mapping
            const { data: tenantMap } = await supabase
                .from("user_tenants")
                .select("tenant_id")
                .eq("user_id", user.id)
                .limit(1)
                .single();
            const tenantId = tenantMap?.tenant_id;
            const orgId = localStorage.getItem("active_org_id");
            const [itemsRes, subRes, catRes, uomRes] = await Promise.all([
                supabase
                    .from("items")
                    .select(`
                        item_id, item_code, item_name, unit_of_measure, is_active, category_id, subobjective_id,
                        subobjective:object_heads_subobjective (
                            subobjective_name_en,
                            subobjective_name_mr
                        ),
                        category:item_categories(category_name)
                    `)
                    .eq("tenant_id", tenantId)
                    .eq("organisation_id_uuid", orgId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from("object_heads_subobjective")
                    .select("subobjective_id, subobjective_name_en, subobjective_name_mr, object_head_code"),
                supabase
                    .from("item_categories")
                    .select("category_id, category_name"),
                supabase
                    .from("proc_uom_master")
                    .select("uom_id, uom_name")
            ]);
            if (itemsRes.error) throw itemsRes.error;
            setItems(itemsRes.data || []);
            setSubObjectives(subRes.data || []);
            setCategories(catRes.data || []);
            setUoms(uomRes.data || []);
        } catch (err) {
            toast.error("Failed to load items: " + err.message);
        } finally {
            setLoading(false);
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: tenantMap } = await supabase.from("user_tenants").select("tenant_id").eq("user_id", user.id).limit(1).single();
            const itemData = {
                tenant_id: tenantMap.tenant_id,
                organisation_id_uuid: localStorage.getItem("active_org_id"),
                item_name: newItem.item_name,
                item_code: newItem.item_code || `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
                unit_of_measure: newItem.unit_of_measure,
                subobjective_id: newItem.subobjective_id,
                category_id: newItem.category_id,
                is_active: true
            };
            let error;
            if (newItem.item_id) {
                const { error: updateError } = await supabase
                    .from("items")
                    .update(itemData)
                    .eq("item_id", newItem.item_id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("items")
                    .insert(itemData);
                error = insertError;
            }
            if (error) throw error;
            toast.success(newItem.item_id ? "Item updated successfully! ✅" : "Item added successfully! ✅");
            setShowAddModal(false);
            setNewItem({ item_name: "", item_code: "", unit_of_measure: "Nos", subobjective_id: "" });
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    }
    async function handleQuickAddCat() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: tenantMap } = await supabase.from("user_tenants").select("tenant_id").eq("user_id", user.id).limit(1).single();
            const { data: cat, error } = await supabase.from("item_categories").insert({ category_name: newCatName, tenant_id: tenantMap.tenant_id }).select().single();
            if (error) throw error;
            setCategories([...categories, cat]);
            setNewItem({ ...newItem, category_id: cat.category_id });
            setShowQuickAddCat(false);
            setNewCatName("");
            toast.success("Category added!");
        } catch (err) { toast.error(err.message); }
    }
    async function handleQuickAddUom() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: tenantMap } = await supabase.from("user_tenants").select("tenant_id").eq("user_id", user.id).limit(1).single();
            const { data: uom, error } = await supabase.from("proc_uom_master").insert({ uom_name: newUomName, tenant_id: tenantMap.tenant_id }).select().single();
            if (error) throw error;
            setUoms([...uoms, uom]);
            setNewItem({ ...newItem, unit_of_measure: uom.uom_name });
            setShowQuickAddUom(false);
            setNewUomName("");
            toast.success("Unit added!");
        } catch (err) { toast.error(err.message); }
    }
    const filteredItems = items.filter(i => 
        i.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const selectStyles = {
        control: (base) => ({
            ...base,
            padding: '5px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
        })
    };
    return (
        <div style={container}>
            <Toaster position="top-right" />
            <div style={header}>
                <div>
                    <button onClick={() => navigate("/procurement")} style={backBtn}>← Procurement</button>
                    <h1 style={title}>Statutory Item Master</h1>
                    <p style={subtitle}>Manage catalog items with automated budget mapping rules.</p>
                </div>
                <button style={primaryBtn} onClick={() => {
                    setNewItem({ item_name: "", item_code: "", unit_of_measure: "Nos", subobjective_id: "" });
                    setShowAddModal(true);
                }}>+ Define New Item</button>
            </div>
            <div style={searchBar}>
                <div style={{ position: "relative" }}>
                    <span style={searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search Catalog by Name or Item Code..."
                        style={searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            {loading ? (
                <div style={loadingState}>Initializing Catalog...</div>
            ) : (
                <div style={tableCard}>
                    <table style={table}>
                        <thead>
                            <tr style={tableHeader}>
                                <th style={th}>Item Code</th>
                                <th style={th}>Item Name</th>
                                <th style={th}>Category</th>
                                <th style={th}>UoM</th>
                                <th style={th}>Linked Sub-Objective (Budget Head)</th>
                                <th style={th}>Status</th>
                                <th style={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr><td colSpan="6" style={emptyCell}>No items found. Define your first catalog item.</td></tr>
                            ) : (
                                filteredItems.map((item, idx) => (
                                    <tr key={item.item_id} style={tr}>
                                        <td style={{ ...td, fontWeight: '700', color: '#4f46e5', fontFamily: 'monospace' }}>{item.item_code}</td>
                                        <td style={{ ...td, fontWeight: '600' }}>{item.item_name}</td>
                                        <td style={td}>
                                            <span style={categoryBadge}>{item.category?.category_name || 'Others'}</span>
                                        </td>
                                        <td style={td}>
                                            <span style={uomBadge}>{item.unit_of_measure}</span>
                                        </td>
                                        <td style={td}>
                                            {item.subobjective ? (
                                                <div style={subObjectiveBadge}>
                                                    <span style={subLabelEn}>{item.subobjective.subobjective_name_en}</span>
                                                    <span style={subLabelMr}>{item.subobjective.subobjective_name_mr}</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#ef4444', fontSize: '12px', fontStyle: 'italic' }}>Unmapped (No Budget Link)</span>
                                            )}
                                        </td>
                                        <td style={td}>
                                            <span style={{ ...statusBadge, backgroundColor: item.is_active ? '#ecfdf5' : '#fee2e2', color: item.is_active ? '#059669' : '#dc2626' }}>
                                                {item.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td style={td}>
                                            <button 
                                                style={actionBtn} 
                                                onClick={() => {
                                                    setNewItem({
                                                        item_id: item.item_id,
                                                        item_name: item.item_name,
                                                        item_code: item.item_code,
                                                        unit_of_measure: item.unit_of_measure,
                                                        subobjective_id: item.subobjective_id || (item.subobjective?.subobjective_id),
                                                        category_id: item.category_id
                                                    });
                                                    setShowAddModal(true);
                                                }}
                                            >
                                                Edit Policy
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Modal for adding/editing items */}
            {showAddModal && (
                <div style={overlay}>
                    <div style={modal}>
                        <h3 style={modalTitle}>{newItem.item_id ? "Edit Master Item" : "Define Master Item"}</h3>
                        <p style={modalSubtitle}>Assign a statutory budget head to this item for automated procurement.</p>
                        
                        <form onSubmit={handleSubmit} style={modalForm}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={inputGroup}>
                                    <label style={label}>Item Name</label>
                                    <input placeholder="e.g. Paracetamol Strip" style={modalInput} required value={newItem.item_name} onChange={e => setNewItem({ ...newItem, item_name: e.target.value })} />
                                </div>
                                <div style={inputGroup}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label style={label}>Major Category</label>
                                        <button type="button" onClick={() => setShowQuickAddCat(true)} style={quickAddLink}>+ Add</button>
                                    </div>
                                    <select style={modalInput} required value={newItem.category_id} onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}>
                                        <option value="">Select Category...</option>
                                        {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={inputGroup}>
                                <label style={label}>Item Code (Internal)</label>
                                <input placeholder="Auto-generated if empty" style={modalInput} value={newItem.item_code} onChange={e => setNewItem({ ...newItem, item_code: e.target.value })} />
                            </div>
                            <div style={inputGroup}>
                                <label style={label}>Budget Mapping (Sub-Objective)</label>
                                <Select
                                    placeholder="Search Statutory Detail..."
                                    options={subObjectives.map(so => ({
                                        value: so.subobjective_id,
                                        label: `${so.subobjective_name_en} / ${so.subobjective_name_mr}`
                                    }))}
                                    value={subObjectives.find(so => so.subobjective_id === newItem.subobjective_id) ? {
                                        value: newItem.subobjective_id,
                                        label: `${subObjectives.find(so => so.subobjective_id === newItem.subobjective_id).subobjective_name_en} / ${subObjectives.find(so => so.subobjective_id === newItem.subobjective_id).subobjective_name_mr}`
                                    } : null}
                                    onChange={(val) => setNewItem({ ...newItem, subobjective_id: val.value })}
                                    styles={selectStyles}
                                />
                            </div>
                            <div style={inputGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label style={label}>Unit of Measure</label>
                                    <button type="button" onClick={() => setShowQuickAddUom(true)} style={quickAddLink}>+ Add</button>
                                </div>
                                <select style={modalInput} value={newItem.unit_of_measure} onChange={e => setNewItem({ ...newItem, unit_of_measure: e.target.value })}>
                                    <option value="">Select UoM...</option>
                                    {uoms.map(u => <option key={u.uom_id} value={u.uom_name}>{u.uom_name}</option>)}
                                </select>
                            </div>
                            <div style={modalButtons}>
                                <button type="button" style={cancelBtn} onClick={() => {
                                    setShowAddModal(false);
                                    setNewItem({ item_name: "", item_code: "", unit_of_measure: "Nos", subobjective_id: "", category_id: "" });
                                }}>Cancel</button>
                                <button type="submit" style={saveBtn}>{newItem.item_id ? "Update Policy" : "Save Item Policy"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Quick Add Modals */}
            {showQuickAddCat && (
                <div style={smallOverlay}>
                    <div style={smallModal}>
                        <h4 style={{ margin: '0 0 16px 0' }}>Add Category</h4>
                        <input placeholder="Enter Category Name..." style={modalInput} value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button onClick={() => setShowQuickAddCat(false)} style={cancelBtn}>Back</button>
                            <button onClick={handleQuickAddCat} style={saveBtn}>Add</button>
                        </div>
                    </div>
                </div>
            )}
            {showQuickAddUom && (
                <div style={smallOverlay}>
                    <div style={smallModal}>
                        <h4 style={{ margin: '0 0 16px 0' }}>Add Unit</h4>
                        <input placeholder="Enter Unit Name..." style={modalInput} value={newUomName} onChange={e => setNewUomName(e.target.value)} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button onClick={() => setShowQuickAddUom(false)} style={cancelBtn}>Back</button>
                            <button onClick={handleQuickAddUom} style={saveBtn}>Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// STYLES (Enriched with Glassmorphism and Modern UI principles)
const container = { padding: "40px", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "'Outfit', sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" };
const backBtn = { background: "none", border: "none", color: "#6b7280", fontWeight: "600", cursor: "pointer", marginBottom: "10px", display: "block" };
const title = { fontSize: "32px", fontWeight: "800", color: "#111827", margin: 0, letterSpacing: "-1px" };
const subtitle = { color: "#6b7280", marginTop: "4px", fontSize: "16px" };
const primaryBtn = { backgroundColor: "#4f46e5", color: "white", padding: "14px 28px", borderRadius: "14px", border: "none", fontWeight: "700", cursor: "pointer", boxShadow: "0 10px 20px -5px rgba(79, 70, 229, 0.4)" };
const searchBar = { marginBottom: "32px" };
const searchInput = { width: "100%", padding: "16px 20px 16px 50px", borderRadius: "16px", border: "1px solid rgba(226, 232, 240, 0.8)", backgroundColor: "white", outline: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", fontSize: "15px" };
const searchIcon = { position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" };
const tableCard = { backgroundColor: "white", borderRadius: "32px", overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.03)" };
const table = { width: "100%", borderCollapse: "collapse" };
const tableHeader = { backgroundColor: "#f9fafb", borderBottom: "1px solid #f1f5f9" };
const th = { textAlign: "left", padding: "18px 24px", color: "#6b7280", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.2px" };
const td = { padding: "20px 24px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f1f5f9" };
const tr = { transition: "background-color 0.2s" };
const statusBadge = { padding: "5px 14px", borderRadius: "99px", fontSize: "12px", fontWeight: "700", letterSpacing: "0.2px" };
const uomBadge = { backgroundColor: "#f3f4f6", color: "#4b5563", padding: "4px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" };
const categoryBadge = { color: "#10b981", backgroundColor: "#f0fdf4", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" };
const quickAddLink = { background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0 };
const subObjectiveBadge = { display: "flex", flexDirection: "column", gap: "2px" };
const subLabelEn = { fontSize: "14px", color: "#1f2937", fontWeight: "600" };
const subLabelMr = { fontSize: "12px", color: "#4f46e5", fontWeight: "500" };
const actionBtn = { background: "#eff6ff", border: "none", padding: "8px 16px", borderRadius: "10px", color: "#3b82f6", fontWeight: "700", cursor: "pointer", fontSize: "12px" };
const emptyCell = { textAlign: "center", padding: "60px", color: "#9ca3af", fontStyle: "italic" };
const loadingState = { textAlign: "center", padding: "100px", color: "#6b7280", fontWeight: "600" };
const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modal = { backgroundColor: "white", padding: "48px", borderRadius: "32px", width: "500px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" };
const modalTitle = { fontSize: "24px", fontWeight: "800", color: "#111827", margin: "0 0 8px 0" };
const modalSubtitle = { color: "#6b7280", fontSize: "14px", marginBottom: "32px" };
const modalForm = { display: "flex", flexDirection: "column", gap: "20px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
const label = { fontSize: "13px", fontWeight: "700", color: "#374151", marginLeft: "4px" };
const modalInput = { padding: "14px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "15px", backgroundColor: "#f9fafb" };
const modalButtons = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" };
const cancelBtn = { background: "white", color: "#6b7280", border: "1px solid #e2e8f0", padding: "14px 28px", borderRadius: "14px", fontWeight: "700", cursor: "pointer" };
const saveBtn = { backgroundColor: "#4f46e5", color: "white", border: "none", padding: "14px 28px", borderRadius: "14px", fontWeight: "700", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)" };
const smallOverlay = { ...overlay, zIndex: 2000 };
const smallModal = { ...modal, width: '400px', padding: '32px' };