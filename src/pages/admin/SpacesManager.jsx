import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

const styles = {
    container: {
        display: "flex",
        height: "calc(100vh - 100px)",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
        width: "350px",
        backgroundColor: "white",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    main: {
        flex: 1,
        padding: "40px",
        overflowY: "auto",
        backgroundColor: "#f8fafc",
    },
    sidebarHeader: {
        padding: "24px",
        borderBottom: "1px solid #f1f5f9",
    },
    title: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
    },
    subTitle: {
        fontSize: "12px",
        color: "#64748b",
        marginTop: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    treeContainer: {
        padding: "16px",
        flex: 1,
        overflowY: "auto",
    },
    treeItem: (level, selected) => ({
        padding: "12px 16px",
        marginLeft: `${level * 16}px`,
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: selected ? "700" : "500",
        color: selected ? "#0ea5e9" : "#475569",
        backgroundColor: selected ? "#f0f9ff" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "all 0.2s",
        "&:hover": {
            backgroundColor: "#f1f5f9",
        }
    }),
    detailCard: {
        backgroundColor: "white",
        borderRadius: "24px",
        padding: "32px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e2e8f0",
    },
    floorPlanPlaceholder: {
        width: "100%",
        height: "400px",
        backgroundColor: "#f1f5f9",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px dashed #cbd5e1",
        color: "#94a3b8",
        marginBottom: "30px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginTop: "30px",
    },
    resourceCard: {
        padding: "20px",
        borderRadius: "16px",
        backgroundColor: "#fff",
        border: "1px solid #f1f5f9",
    },
    badge: (type) => ({
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "10px",
        fontWeight: "800",
        textTransform: "uppercase",
        backgroundColor: type === 'Human' ? '#dbeafe' : '#f3e8ff',
        color: type === 'Human' ? '#1e40af' : '#6b21a8',
    }),
    sharedBadge: {
        fontSize: "9px",
        padding: "2px 6px",
        borderRadius: "4px",
        backgroundColor: "#fef3c7",
        color: "#92400e",
        marginLeft: "8px",
        fontWeight: "800",
        verticalAlign: "middle"
    },
    addIconBtn: {
        width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e2e8f0",
        backgroundColor: "white", color: "#0ea5e9", fontWeight: "900", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    miniBtn: {
        width: "20px", height: "20px", borderRadius: "4px", border: "1px solid #e2e8f0",
        backgroundColor: "white", color: "#0ea5e9", fontSize: "14px", fontWeight: "900",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
    },
    miniBtnDanger: {
        width: "20px", height: "20px", borderRadius: "4px", border: "1px solid #e2e8f0",
        backgroundColor: "white", color: "#ef4444", fontSize: "14px", fontWeight: "900",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
    },
    modalOverlay: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15, 23, 42, 0.7)", display: "flex", 
        justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)"
    },
    modal: {
        background: "white", padding: "32px", borderRadius: "20px", width: "400px",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
    },
    modalInput: {
        width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #e2e8f0",
        fontSize: "14px", marginTop: "8px", outline: "none"
    },
    btnAction: {
        padding: "10px 20px", background: "#0ea5e9", color: "white",
        border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer"
    },
    ghostBtn: {
        padding: "10px 20px", background: "transparent", border: "none",
        color: "#64748b", fontWeight: "700", cursor: "pointer"
    }
};

export default function SpacesManager() {
    const [types, setTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [subUnits, setSubUnits] = useState([]);
    const [masters, setMasters] = useState([]);
    const [unitMasters, setUnitMasters] = useState([]);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const isResizing = React.useRef(false);
    
    const [selectedType, setSelectedType] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [sharedSpaces, setSharedSpaces] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    const [showUnitModal, setShowUnitModal] = useState(false);
    const [showSubUnitModal, setShowSubUnitModal] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [newArea, setNewArea] = useState(0);
    const [renameTarget, setRenameTarget] = useState(null);
    const [renameTo, setRenameTo] = useState("");
    const [dragOverId, setDragOverId] = useState(null);
    const dragItemId = React.useRef(null);
    const [showOrgTypeModal, setShowOrgTypeModal] = useState(false);
    const [editingOrgType, setEditingOrgType] = useState(null);
    const [orgTypeName, setOrgTypeName] = useState("");

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.schema("core").from("profiles").select("*").eq("id", user.id).single();
                    setUserProfile(profile);
                }
                await Promise.all([
                    fetchTypes(),
                    fetchMasters(),
                    fetchUnitMasters()
                ]);
            } catch (err) {
                console.error("SpacesManager Init failed:", err);
            } finally {
                setLoading(false);
            }
        };
        initialize();

        const onMouseMove = (e) => {
            if (!isResizing.current) return;
            const newWidth = Math.min(600, Math.max(200, e.clientX - 40));
            setSidebarWidth(newWidth);
        };
        const onMouseUp = () => { isResizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
    }, []);

    const fetchMasters = async () => {
        let query = supabase.from('master_organisation_sub_units').select('*').order('sub_unit_name');
        
        if (userProfile?.role === 'TENANT_ADMIN' || userProfile?.role === 'ORG_ADMIN') {
            const level = userProfile.role === 'TENANT_ADMIN' ? 'TENANT' : 'ORGANISATION';
            const selectionTable = level === 'TENANT' ? 'tenant_master_selections' : 'organisation_master_selections';
            const filterCol = level === 'TENANT' ? 'tenant_id' : 'organisation_id';
            const entityId = level === 'TENANT' ? userProfile.tenant_id : userProfile.organisation_id;

            const { data: selections } = await supabase.schema('core').from(selectionTable).select('master_id').eq(filterCol, entityId).eq('master_type', 'sub_unit');
            if (selections) {
                const ids = selections.map(s => s.master_id);
                if (ids.length > 0) query = query.in('id', ids);
                else { setMasters([]); return; }
            }
        }
        
        const { data } = await query;
        setMasters(data || []);
    };

    const fetchUnitMasters = async () => {
        let query = supabase.from('master_organisation_units').select('*').order('unit_name');

        if (userProfile?.role === 'TENANT_ADMIN' || userProfile?.role === 'ORG_ADMIN') {
            const level = userProfile.role === 'TENANT_ADMIN' ? 'TENANT' : 'ORGANISATION';
            const selectionTable = level === 'TENANT' ? 'tenant_master_selections' : 'organisation_master_selections';
            const filterCol = level === 'TENANT' ? 'tenant_id' : 'organisation_id';
            const entityId = level === 'TENANT' ? userProfile.tenant_id : userProfile.organisation_id;

            const { data: selections } = await supabase.schema('core').from(selectionTable).select('master_id').eq(filterCol, entityId).eq('master_type', 'unit');
            if (selections) {
                const ids = selections.map(s => s.master_id);
                if (ids.length > 0) query = query.in('id', ids);
                else { setUnitMasters([]); return; }
            }
        }

        const { data } = await query;
        setUnitMasters(data || []);
    };

    const fetchTypes = async () => {
        const { data } = await supabase.from('organisation_types').select('*').order('organisation_type');
        setTypes(data || []);
    };

    const fetchUnits = async (typeId) => {
        const { data } = await supabase.from('organisation_type_units').select('*').eq('organisation_type_id', typeId).order('sort_order', { ascending: true });
        setUnits(data || []);
        
        // Fetch all shared spaces for this Org Type
        const { data: shared } = await supabase
            .from('organisation_unit_sub_units')
            .select('*')
            .eq('is_shared', true)
            .in('parent_unit_id', (data || []).map(u => u.id));
        setSharedSpaces(shared || []);
        
        setSubUnits([]);
        setSelectedUnit(null);
        setSelectedSpace(null);
    };

    const fetchSubUnits = async (unitId) => {
        const { data } = await supabase.from('organisation_unit_sub_units').select('*').eq('parent_unit_id', unitId).order('sub_unit_name');
        setSubUnits(data || []);
        setSelectedSpace(null);
    };

    const handleAddUnit = async () => {
        if (!selectedType || !newItemName.trim()) return toast.error("Unit name is required");
        
        // UI-level duplicate check
        const isDuplicate = units.some(u => u.unit_name.trim().toLowerCase() === newItemName.trim().toLowerCase());
        if (isDuplicate) return toast.error(`"${newItemName}" already exists under ${selectedType.organisation_type}`);

        const { error } = await supabase.from('organisation_type_units').insert({
            organisation_type_id: selectedType.organisation_type_id,
            unit_name: newItemName.trim()
        });
        if (error) toast.error(error.message);
        else {
            toast.success("Unit created");
            setShowUnitModal(false);
            setNewItemName("");
            fetchUnits(selectedType.organisation_type_id);
        }
    };

    const handleAddSubUnit = async () => {
        if (!selectedUnit || !newItemName.trim()) return toast.error("Sub-Unit name is required");
        
        // Find if this name matches a shared master
        const master = masters.find(m => m.sub_unit_name === newItemName.trim());
        const shouldBeShared = master ? master.is_shared_by_default : false;
        const finalName = shouldBeShared && !newItemName.trim().endsWith(" (Shared)") ? `${newItemName.trim()} (Shared)` : newItemName.trim();

        // UI-level duplicate check
        const isDuplicate = subUnits.some(s => s.sub_unit_name.trim().toLowerCase() === finalName.toLowerCase());
        if (isDuplicate) return toast.error(`"${finalName}" already exists under ${selectedUnit.unit_name}`);

        const { error } = await supabase.from('organisation_unit_sub_units').insert({
            parent_unit_id: selectedUnit.id,
            sub_unit_name: finalName,
            actual_area: newArea,
            is_shared: shouldBeShared
        });
        if (error) toast.error(error.message);
        else {
            toast.success("Sub-Unit created" + (shouldBeShared ? " (Shared)" : ""));
            setShowSubUnitModal(false);
            setNewItemName("");
            setNewArea(0);
            fetchSubUnits(selectedUnit.id);
        }
    };

    const handleDeleteUnit = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this unit and all its sub-units?")) return;
        const { error } = await supabase.from('organisation_type_units').delete().eq('id', id);
        if (error) toast.error(error.message);
        else {
            toast.success("Unit deleted");
            fetchUnits(selectedType.organisation_type_id);
        }
    };

    const handleDeleteSubUnit = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this sub-unit?")) return;
        const { error } = await supabase.from('organisation_unit_sub_units').delete().eq('id', id);
        if (error) toast.error(error.message);
        else {
            toast.success("Sub-Unit deleted");
            fetchSubUnits(selectedUnit.id);
        }
    };

    const handleDragReorder = async (draggedId, targetId) => {
        if (draggedId === targetId) return;
        const oldOrder = [...units];
        const dragIdx = oldOrder.findIndex(u => u.id === draggedId);
        const targetIdx = oldOrder.findIndex(u => u.id === targetId);
        if (dragIdx === -1 || targetIdx === -1) return;

        // Reorder locally (optimistic update)
        const reordered = [...oldOrder];
        const [removed] = reordered.splice(dragIdx, 1);
        reordered.splice(targetIdx, 0, removed);
        setUnits(reordered);

        // Persist new sort_order to DB
        const updates = reordered.map((u, idx) => 
            supabase.from('organisation_type_units').update({ sort_order: idx + 1 }).eq('id', u.id)
        );
        const results = await Promise.all(updates);
        const failed = results.find(r => r.error);
        if (failed) {
            toast.error("Failed to save order");
            setUnits(oldOrder); // rollback
        }
    };

    const handleRename = async () => {
        if (!renameTarget || !renameTo.trim()) return toast.error("Name cannot be empty");

        let error;
        if (renameTarget.type === 'unit') {
            const isDup = units.some(u => u.id !== renameTarget.id && u.unit_name.toLowerCase() === renameTo.trim().toLowerCase());
            if (isDup) return toast.error(`"${renameTo.trim()}" already exists in this Org Type`);
            ({ error } = await supabase.from('organisation_type_units').update({ unit_name: renameTo.trim() }).eq('id', renameTarget.id));
            if (!error) { toast.success("Unit renamed"); fetchUnits(selectedType.organisation_type_id); }
        } else {
            const isDup = subUnits.some(s => s.id !== renameTarget.id && s.sub_unit_name.toLowerCase() === renameTo.trim().toLowerCase());
            if (isDup) return toast.error(`"${renameTo.trim()}" already exists under this Unit`);
            ({ error } = await supabase.from('organisation_unit_sub_units').update({ sub_unit_name: renameTo.trim() }).eq('id', renameTarget.id));
            if (!error) { toast.success("Sub-Unit renamed"); fetchSubUnits(selectedUnit.id); }
        }

        if (error) toast.error(error.message);
        else { setRenameTarget(null); setRenameTo(""); }
    };

    const handleAddOrgType = async () => {
        if (!orgTypeName.trim()) return toast.error("Name is required");
        const isDup = types.some(t => t.organisation_type.toLowerCase() === orgTypeName.trim().toLowerCase());
        if (isDup) return toast.error(`"${orgTypeName.trim()}" already exists`);
        const autoCode = orgTypeName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        const { error } = await supabase.from('organisation_types').insert({ organisation_type: orgTypeName.trim(), organisation_type_code: autoCode });
        if (error) toast.error(error.message);
        else { toast.success("Organisation Type created"); setShowOrgTypeModal(false); setOrgTypeName(""); fetchTypes(); }
    };

    const handleEditOrgType = async () => {
        if (!orgTypeName.trim()) return toast.error("Name is required");
        const { error } = await supabase.from('organisation_types').update({ organisation_type: orgTypeName.trim() }).eq('organisation_type_id', editingOrgType.organisation_type_id);
        if (error) toast.error(error.message);
        else { toast.success("Organisation Type renamed"); setShowOrgTypeModal(false); setEditingOrgType(null); setOrgTypeName(""); fetchTypes(); }
    };

    const handleDeleteOrgType = async (t, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${t.organisation_type}"? This will also delete all Units and Sub-Units under it.`)) return;
        const { error } = await supabase.from('organisation_types').delete().eq('organisation_type_id', t.organisation_type_id);
        if (error) toast.error(error.message);
        else { toast.success("Deleted"); if (selectedType?.organisation_type_id === t.organisation_type_id) { setSelectedType(null); setUnits([]); } fetchTypes(); }
    };

    const fetchSpaceDetails = async (space) => {
        setSelectedSpace(space);
        setLoading(true);
        const { data } = await supabase
            .from('organisation_unit_resource_actuals')
            .select(`
                allocated_qty,
                master_sub_unit_resource_blueprints (
                    resource_name,
                    resource_type
                )
            `)
            .eq('org_sub_unit_id', space.id);
        
        setResources(data || []);
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <Toaster />
            
            {/* Hierarchy Sidebar */}
            <div style={{ ...styles.sidebar, width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}>
                <div style={styles.sidebarHeader}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={styles.title}>Org Type Explorer</h2>
                            <p style={styles.subTitle}>Hierarchy Management</p>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                            <button
                                onClick={() => { setEditingOrgType(null); setOrgTypeName(""); setShowOrgTypeModal(true); }}
                                style={{ ...styles.addIconBtn, backgroundColor: "#f0fdf4", color: "#16a34a", fontSize: "11px", padding: "4px 8px", borderRadius: "8px", fontWeight: "800" }}
                                title="Add Org Type"
                            >+ Type</button>
                            {selectedType && (
                                <button 
                                    onClick={() => setShowUnitModal(true)}
                                    style={styles.addIconBtn}
                                    title="Add Unit to selected Org Type"
                                >+</button>
                            )}
                        </div>
                    </div>
                </div>
                
                <div style={styles.treeContainer}>
                    {types.map(t => (
                        <div key={t.organisation_type_id}>
                            <div 
                                style={styles.treeItem(0, selectedType?.organisation_type_id === t.organisation_type_id)}
                                onClick={() => { setSelectedType(t); fetchUnits(t.organisation_type_id); }}
                            >
                                <span>🏢 {t.organisation_type}</span>
                                <div style={{ display: "flex", gap: "4px" }} onClick={e => e.stopPropagation()}>
                                    <button
                                        style={{ ...styles.miniBtn, color: "#f97316" }}
                                        title="Rename Org Type"
                                        onClick={(e) => { e.stopPropagation(); setEditingOrgType(t); setOrgTypeName(t.organisation_type); setShowOrgTypeModal(true); }}
                                    >✎</button>
                                    <button
                                        style={styles.miniBtnDanger}
                                        title="Delete Org Type"
                                        onClick={(e) => handleDeleteOrgType(t, e)}
                                    >×</button>
                                </div>
                            </div>
                            
                            {selectedType?.organisation_type_id === t.organisation_type_id && units.map(u => (
                                <div 
                                    key={u.id}
                                    draggable
                                    onDragStart={() => { dragItemId.current = u.id; }}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverId(u.id); }}
                                    onDragLeave={() => setDragOverId(null)}
                                    onDrop={() => { setDragOverId(null); handleDragReorder(dragItemId.current, u.id); }}
                                    style={{ opacity: dragItemId.current === u.id ? 0.5 : 1 }}
                                >
                                    <div 
                                        style={{
                                            ...styles.treeItem(1, selectedUnit?.id === u.id),
                                            borderTop: dragOverId === u.id ? "2px solid #0ea5e9" : "2px solid transparent",
                                            cursor: "grab"
                                        }}
                                        onClick={() => { setSelectedUnit(u); fetchSubUnits(u.id); }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ color: "#cbd5e1", fontSize: "12px", cursor: "grab" }}>⠿</span>
                                                📁 {u.unit_name}
                                                {!unitMasters.some(m => m.unit_name.toLowerCase() === u.unit_name.toLowerCase()) && (
                                                    <span title="Not in master list" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f97316", display: "inline-block", flexShrink: 0 }} />
                                                )}
                                            </span>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button style={{ ...styles.miniBtn, color: "#f97316" }} title="Rename Unit" onClick={(e) => { e.stopPropagation(); setRenameTarget({ id: u.id, type: 'unit', currentName: u.unit_name }); setRenameTo(u.unit_name); }}>✎</button>
                                                <button style={styles.miniBtn} title="Add Sub-Unit" onClick={(e) => { e.stopPropagation(); setSelectedUnit(u); setShowSubUnitModal(true); }}>+</button>
                                                <button style={styles.miniBtnDanger} title="Delete Unit" onClick={(e) => handleDeleteUnit(u.id, e)}>×</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {selectedUnit?.id === u.id && [
                                        ...subUnits,
                                        ...sharedSpaces.filter(s => s.parent_unit_id !== u.id && s.is_shared) // Add others if shared logic grows
                                    ].filter((item, index, self) => self.findIndex(t => t.id === item.id) === index).map(s => (
                                        <div 
                                            key={s.id}
                                            style={styles.treeItem(2, selectedSpace?.id === s.id)}
                                            onClick={() => fetchSpaceDetails(s)}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    📍 {s.sub_unit_name}
                                                    {s.is_shared && <span style={styles.sharedBadge}>SHARED</span>}
                                                    {!masters.some(m => m.sub_unit_name.toLowerCase() === s.sub_unit_name.toLowerCase().replace(/ \(shared\)$/, '')) && (
                                                        <span title="Not in master list" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f97316", display: "inline-block", flexShrink: 0 }} />
                                                    )}
                                                </span>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button style={{ ...styles.miniBtn, color: "#f97316" }} title="Rename Sub-Unit" onClick={(e) => { e.stopPropagation(); setRenameTarget({ id: s.id, type: 'subunit', currentName: s.sub_unit_name }); setRenameTo(s.sub_unit_name); }}>✎</button>
                                                    <button style={styles.miniBtnDanger} title="Delete Sub-Unit" onClick={(e) => handleDeleteSubUnit(s.id, e)}>×</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={() => {
                    isResizing.current = true;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                }}
                style={{
                    width: "6px",
                    cursor: "col-resize",
                    backgroundColor: "transparent",
                    flexShrink: 0,
                    position: "relative",
                    transition: "background-color 0.2s",
                    zIndex: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#cbd5e1"}
                onMouseLeave={e => { if (!isResizing.current) e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Drag to resize"
            />

            {/* Main Content Area */}
            <div style={styles.main}>
                {selectedSpace ? (
                    <div style={styles.detailCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
                            <div>
                                <h1 style={{ fontSize: "32px", fontWeight: "900", margin: 0, color: "#0f172a" }}>{selectedSpace.sub_unit_name}</h1>
                                <p style={{ color: "#64748b", margin: "4px 0" }}>{selectedUnit.unit_name} • {selectedType.organisation_type}</p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "24px", fontWeight: "900", color: "#0ea5e9" }}>{selectedSpace.actual_area || '0'} sq.m</div>
                                <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Total Area</div>
                            </div>
                        </div>

                        {/* Floor Plan Section */}
                        <div style={styles.floorPlanPlaceholder}>
                            {selectedSpace.actual_floor_plan_url ? (
                                <img src={selectedSpace.actual_floor_plan_url} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "16px" }} alt="Floor Plan" />
                            ) : (
                                <>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M3 3h18v18H3V3z" />
                                        <path d="M3 9h18M9 21V9" />
                                    </svg>
                                    <p style={{ marginTop: "16px", fontWeight: "600" }}>No Floor Plan Uploaded</p>
                                    <button style={{ 
                                        marginTop: "12px", 
                                        padding: "8px 16px", 
                                        borderRadius: "8px", 
                                        border: "1px solid #e2e8f0",
                                        backgroundColor: "white",
                                        color: "#475569",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}>Upload Floor Plan</button>
                                </>
                            )}
                        </div>

                        {/* Resource Section */}
                        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>Allocated Resources</h3>
                        {loading ? (
                            <p>Loading resources...</p>
                        ) : (
                            <div style={styles.grid}>
                                {resources.length > 0 ? resources.map((res, idx) => (
                                    <div key={idx} style={styles.resourceCard}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontWeight: "700", color: "#1e293b" }}>{res.master_sub_unit_resource_blueprints?.resource_name}</div>
                                                <span style={styles.badge(res.master_sub_unit_resource_blueprints?.resource_type)}>
                                                    {res.master_sub_unit_resource_blueprints?.resource_type}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>
                                                {res.allocated_qty}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ gridColumn: "span 2", padding: "40px", textAlign: "center", color: "#94a3b8", backgroundColor: "#f8fafc", borderRadius: "16px" }}>
                                        No resources allocated to this space yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M3 21h18M3 7v14M21 7v14M6 21V7a2 2 0 012-2h8a2 2 0 012 2v14M9 5V3a1 1 0 011-1h4a1 1 0 011 1v2M12 21V11" />
                        </svg>
                        <h2 style={{ marginTop: "20px", fontWeight: "700" }}>Select a Space to View Details</h2>
                        <p style={{ fontSize: "14px" }}>Navigate through the hierarchy on the left</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {(showUnitModal || showSubUnitModal) && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={{ margin: "0 0 20px 0" }}>Add {showUnitModal ? 'Unit' : 'Sub-Unit'}</h3>
                        {showUnitModal && (
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>CHOOSE FROM UNIT MASTER (OPTIONAL)</label>
                                <select 
                                    style={styles.modalInput}
                                    onChange={(e) => {
                                        const master = unitMasters.find(m => m.id === e.target.value);
                                        if (master) setNewItemName(master.unit_name);
                                    }}
                                >
                                    <option value="">Custom Name...</option>
                                    {unitMasters.map(m => (
                                        <option key={m.id} value={m.id}>{m.unit_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {showSubUnitModal && (
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>CHOOSE FROM SUB-UNIT MASTER (OPTIONAL)</label>
                                <select 
                                    style={styles.modalInput}
                                    onChange={(e) => {
                                        const master = masters.find(m => m.id === e.target.value);
                                        if (master) {
                                            setNewItemName(master.sub_unit_name);
                                            setNewArea(master.required_area);
                                        }
                                    }}
                                >
                                    <option value="">Custom Name...</option>
                                    {masters.map(m => (
                                        <option key={m.id} value={m.id}>{m.sub_unit_name} ({m.required_area} sq.m)</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>NAME</label>
                            <input 
                                style={styles.modalInput} 
                                value={newItemName} 
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder={showUnitModal ? "E.g. Department of Radiology" : "E.g. Dark Room"}
                            />
                            {/* Live warning if name doesn't match any master */}
                            {newItemName.trim() && (() => {
                                const masterList = showUnitModal ? unitMasters.map(m => m.unit_name.toLowerCase()) : masters.map(m => m.sub_unit_name.toLowerCase());
                                const isStandard = masterList.includes(newItemName.trim().replace(/ \(shared\)$/i, '').toLowerCase());
                                if (!isStandard) return (
                                    <div style={{ marginTop: "8px", padding: "8px 12px", backgroundColor: "#fffbeb", borderRadius: "8px", border: "1px solid #fcd34d", fontSize: "12px", color: "#92400e", display: "flex", alignItems: "center", gap: "6px" }}>
                                        ⚠️ <span>This name is <strong>not in the Master list</strong>. Consider adding it as a master first for consistency.</span>
                                    </div>
                                );
                                return null;
                            })()}
                        </div>
                        {showSubUnitModal && (
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>AREA (SQ.MT)</label>
                                <input 
                                    type="number"
                                    style={styles.modalInput} 
                                    value={newArea} 
                                    onChange={(e) => setNewArea(e.target.value)}
                                />
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button style={styles.ghostBtn} onClick={() => { setShowUnitModal(false); setShowSubUnitModal(false); }}>Cancel</button>
                            <button style={styles.btnAction} onClick={showUnitModal ? handleAddUnit : handleAddSubUnit}>Create Item</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renameTarget && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={{ margin: "0 0 6px 0" }}>Rename {renameTarget.type === 'unit' ? 'Unit' : 'Sub-Unit'}</h3>
                        <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 20px 0" }}>Current: <strong>{renameTarget.currentName}</strong></p>
                        
                        {/* Suggest from master */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>PICK FROM MASTER (OPTIONAL)</label>
                            <select 
                                style={styles.modalInput}
                                onChange={(e) => { if (e.target.value) setRenameTo(e.target.value); }}
                            >
                                <option value="">Type a custom name below...</option>
                                {(renameTarget.type === 'unit' ? unitMasters : masters).map(m => (
                                    <option key={m.id} value={renameTarget.type === 'unit' ? m.unit_name : m.sub_unit_name}>
                                        {renameTarget.type === 'unit' ? m.unit_name : `${m.sub_unit_name} (${m.required_area} sq.m)`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>NEW NAME</label>
                            <input 
                                style={styles.modalInput}
                                value={renameTo}
                                onChange={e => setRenameTo(e.target.value)}
                                placeholder="Enter new name..."
                            />
                            {renameTo.trim() && (() => {
                                const masterList = renameTarget.type === 'unit' ? unitMasters.map(m => m.unit_name.toLowerCase()) : masters.map(m => m.sub_unit_name.toLowerCase());
                                const isStandard = masterList.includes(renameTo.trim().toLowerCase());
                                if (!isStandard) return (
                                    <div style={{ marginTop: "8px", padding: "8px 12px", backgroundColor: "#fffbeb", borderRadius: "8px", border: "1px solid #fcd34d", fontSize: "12px", color: "#92400e" }}>
                                        ⚠️ This name is <strong>not in the Master list</strong>.
                                    </div>
                                );
                                return (
                                    <div style={{ marginTop: "8px", padding: "8px 12px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #86efac", fontSize: "12px", color: "#166534" }}>
                                        ✅ Matches a master — name is standardized.
                                    </div>
                                );
                            })()}
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button style={styles.ghostBtn} onClick={() => { setRenameTarget(null); setRenameTo(""); }}>Cancel</button>
                            <button style={styles.btnAction} onClick={handleRename}>Save New Name</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Org Type Modal */}
            {showOrgTypeModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={{ margin: "0 0 20px 0" }}>{editingOrgType ? "Rename Organisation Type" : "New Organisation Type"}</h3>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Name</label>
                            <input
                                style={styles.modalInput}
                                value={orgTypeName}
                                onChange={e => setOrgTypeName(e.target.value)}
                                placeholder="E.g. Dental College"
                                autoFocus
                            />
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button style={styles.ghostBtn} onClick={() => { setShowOrgTypeModal(false); setEditingOrgType(null); setOrgTypeName(""); }}>Cancel</button>
                            <button style={styles.btnAction} onClick={editingOrgType ? handleEditOrgType : handleAddOrgType}>
                                {editingOrgType ? "Save Changes" : "Create Type"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
