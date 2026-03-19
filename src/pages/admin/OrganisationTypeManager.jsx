import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";
import CreatableSelect from "react-select/creatable";

export default function OrganisationTypeManager() {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [units, setUnits] = useState([]); // Currently assigned units
  const [masterUnits, setMasterUnits] = useState([]); // Pool of all available unit names
  const [loading, setLoading] = useState(true);
  const [showAddType, setShowAddType] = useState(false);
  
  const [newType, setNewType] = useState({
    organisation_type: "",
    organisation_type_code: "",
    organisation_category: "Medical"
  });

  const [editingUnit, setEditingUnit] = useState(null);
  const [editUnitName, setEditUnitName] = useState("");
  const [showEditUnit, setShowEditUnit] = useState(false);
  const [showManageMaster, setShowManageMaster] = useState(false);

  // Sub-unit management
  const [expandedUnits, setExpandedUnits] = useState([]); // Array of parent unit IDs
  const [subUnits, setSubUnits] = useState({}); // { parentId: [subUnits] }
  const [masterSubUnits, setMasterSubUnits] = useState([]); // Global pool of sub-units
  const [showManageMasterSubs, setShowManageMasterSubs] = useState(false);
  
  // Resource Blueprints & Allocation Tracking
  const [unitResources, setUnitResources] = useState({}); // { subUnitId: [resources] }
  const [actualAllocations, setActualAllocations] = useState({}); // { blueprintId: { allocated_qty } }
  const [expandedSubs, setExpandedSubs] = useState([]); // Array of sub-unit IDs to show resources
  
  // Audit History
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [historyTarget, setHistoryTarget] = useState(null); // { name, id }
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.schema("core").from("profiles").select("*").eq("id", user.id).single();
        setUserProfile(profile);
      }
      await Promise.all([
        fetchTypes(),
        fetchMasterUnits(),
        fetchMasterSubUnits()
      ]);
    } catch (err) {
      console.error("Init error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedType) {
      fetchUnits(selectedType.organisation_type_id);
    } else {
      setUnits([]);
    }
  }, [selectedType]);

  async function fetchTypes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("organisation_types")
      .select("*")
      .order("organisation_type");
    
    if (error) {
      toast.error("Failed to fetch types: " + error.message);
    } else {
      setTypes(data || []);
      if (data.length > 0 && !selectedType) {
          setSelectedType(data[0]);
      }
    }
    setLoading(false);
  }

  async function fetchMasterUnits() {
    let query = supabase.from("master_organisation_units").select("*").order("unit_name");
    
    // HIERARCHY LOGIC: Filter if Tenant/Org Admin
    if (userProfile?.role === 'TENANT_ADMIN' || userProfile?.role === 'ORG_ADMIN') {
        const level = userProfile.role === 'TENANT_ADMIN' ? 'TENANT' : 'ORGANISATION';
        const selectionTable = level === 'TENANT' ? 'tenant_master_selections' : 'organisation_master_selections';
        const filterCol = level === 'TENANT' ? 'tenant_id' : 'organisation_id';
        const entityId = level === 'TENANT' ? userProfile.tenant_id : userProfile.organisation_id;

        const { data: selections } = await supabase
            .schema('core')
            .from(selectionTable)
            .select('master_id')
            .eq(filterCol, entityId)
            .eq('master_type', 'unit');
       
       if (selections) {
         const ids = selections.map(s => s.master_id);
         if (ids.length > 0) query = query.in('id', ids);
         else { setMasterUnits([]); return; }
       }
    }

    const { data, error } = await query;
    if (!error) {
      setMasterUnits(data || []);
    }
  }

  async function fetchMasterSubUnits() {
    let query = supabase.from("master_organisation_sub_units").select("*").order("sub_unit_name");

    // HIERARCHY LOGIC: Filter if Tenant/Org Admin
    if (userProfile?.role === 'TENANT_ADMIN' || userProfile?.role === 'ORG_ADMIN') {
        const level = userProfile.role === 'TENANT_ADMIN' ? 'TENANT' : 'ORGANISATION';
        const selectionTable = level === 'TENANT' ? 'tenant_master_selections' : 'organisation_master_selections';
        const filterCol = level === 'TENANT' ? 'tenant_id' : 'organisation_id';
        const entityId = level === 'TENANT' ? userProfile.tenant_id : userProfile.organisation_id;

        const { data: selections } = await supabase
            .schema('core')
            .from(selectionTable)
            .select('master_id')
            .eq(filterCol, entityId)
            .eq('master_type', 'sub_unit');
        
        if (selections) {
          const ids = selections.map(s => s.master_id);
          if (ids.length > 0) query = query.in('id', ids);
          else { setMasterSubUnits([]); return; }
        }
     }

    const { data, error } = await query;
    if (!error) {
      setMasterSubUnits(data || []);
    }
  }

  async function fetchUnits(typeId) {
    const { data, error } = await supabase
      .from("organisation_type_units")
      .select("*")
      .eq("organisation_type_id", typeId)
      .order("sequence", { ascending: true });
    
    if (error) {
      toast.error("Failed to fetch units: " + error.message);
    } else {
      setUnits(data || []);
      // Clear sub-units when switching types
      setSubUnits({});
      setExpandedUnits([]);
    }
  }

  async function fetchSubUnits(parentId) {
    const { data, error } = await supabase
        .from("organisation_unit_sub_units")
        .select("*")
        .eq("parent_unit_id", parentId)
        .order("sequence", { ascending: true });
    
    if (error) {
        toast.error("Failed to fetch sub-units: " + error.message);
    } else {
        setSubUnits(prev => ({ ...prev, [parentId]: data || [] }));
    }
  }

  async function fetchResourceBlueprint(subUnitName, subUnitId) {
    // We fetch based on sub_unit_name from the master blueprints
    const { data: mSub } = await supabase
        .from("master_organisation_sub_units")
        .select("id")
        .eq("sub_unit_name", subUnitName)
        .single();

    if (mSub) {
        const { data, error } = await supabase
            .from("master_sub_unit_resource_blueprints")
            .select("*")
            .eq("master_sub_unit_id", mSub.id);
        
        if (!error) {
            setUnitResources(prev => ({ ...prev, [subUnitId]: data || [] }));
            // Fetch actuals for these blueprints
            if (data && data.length > 0) {
                const bIds = data.map(r => r.id);
                const { data: actuals } = await supabase
                    .from("organisation_unit_resource_actuals")
                    .select("*")
                    .eq("org_sub_unit_id", subUnitId)
                    .in("resource_blueprint_id", bIds);
                
                if (actuals) {
                    const actualMap = {};
                    actuals.forEach(a => { actualMap[a.resource_blueprint_id] = a.allocated_qty; });
                    setActualAllocations(prev => ({ ...prev, [subUnitId]: actualMap }));
                }
            }
        }
    }
  }

  async function handleUpdateAllocation(subUnitId, blueprintId, name, newQty) {
    const { error } = await supabase
        .from("organisation_unit_resource_actuals")
        .upsert([{ 
            org_sub_unit_id: subUnitId, 
            resource_blueprint_id: blueprintId, 
            resource_name: name,
            allocated_qty: parseInt(newQty) || 0
        }], { onConflict: 'org_sub_unit_id,resource_blueprint_id' });

    if (error) {
        toast.error("Allocation update failed: " + error.message);
    } else {
        setActualAllocations(prev => ({
            ...prev,
            [subUnitId]: { ...prev[subUnitId], [blueprintId]: parseInt(newQty) }
        }));
        toast.success("Allocation updated");
    }
  }

  async function fetchAuditHistory(subUnit) {
    setHistoryTarget({ name: subUnit.sub_unit_name, id: subUnit.id });
    const { data, error } = await supabase
        .from("organisation_unit_resource_audit_logs")
        .select("*")
        .eq("org_sub_unit_id", subUnit.id)
        .order("created_at", { ascending: false });
    
    if (!error) {
        setAuditLogs(data || []);
        setShowAuditHistory(true);
    }
  }

  const toggleExpandSub = (sub) => {
    if (expandedSubs.includes(sub.id)) {
        setExpandedSubs(expandedSubs.filter(id => id !== sub.id));
    } else {
        setExpandedSubs([...expandedSubs, sub.id]);
        if (!unitResources[sub.id]) {
            fetchResourceBlueprint(sub.sub_unit_name, sub.id);
        }
    }
  };

  const toggleExpandUnit = (unitId) => {
    if (expandedUnits.includes(unitId)) {
        setExpandedUnits(expandedUnits.filter(id => id !== unitId));
    } else {
        setExpandedUnits([...expandedUnits, unitId]);
        if (!subUnits[unitId]) {
            fetchSubUnits(unitId);
        }
    }
  };

  async function handleAddSubUnit(parentId, subUnitName) {
    if (!subUnitName) return;

    // Check if subUnitName exists in master, else add it
    let finalName = subUnitName;
    const existingMaster = masterSubUnits.find(m => m.sub_unit_name.toLowerCase() === subUnitName.toLowerCase());
    
    if (!existingMaster) {
        const { data: newM, error: mErr } = await supabase
            .from("master_organisation_sub_units")
            .insert([{ sub_unit_name: subUnitName }])
            .select()
            .single();
        if (!mErr) {
            setMasterSubUnits(prev => [...prev, newM]);
        }
    }

    const currentSubUnits = subUnits[parentId] || [];
    const nextSeq = currentSubUnits.length > 0 ? Math.max(...currentSubUnits.map(s => s.sequence)) + 1 : 0;

    const { data, error } = await supabase
        .from("organisation_unit_sub_units")
        .insert([{ parent_unit_id: parentId, sub_unit_name: finalName, sequence: nextSeq }])
        .select();

    if (error) {
        toast.error("Failed to add facility: " + error.message);
    } else {
        toast.success("Facility added");
        setSubUnits(prev => ({ ...prev, [parentId]: [...currentSubUnits, data[0]] }));
    }
  }

  async function handleDeleteSubUnit(subUnitId, parentId) {
    const { error } = await supabase
        .from("organisation_unit_sub_units")
        .delete()
        .eq("id", subUnitId);
    
    if (error) {
        toast.error("Delete failed: " + error.message);
    } else {
        setSubUnits(prev => ({ 
            ...prev, 
            [parentId]: prev[parentId].filter(s => s.id !== subUnitId) 
        }));
        toast.success("Sub-unit removed");
    }
  }

  async function handleAddType(e) {
    e.preventDefault();
    if (!newType.organisation_type) return;

    const { data, error } = await supabase
      .from("organisation_types")
      .insert([newType])
      .select();

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Type created!");
      setTypes([data[0], ...types]);
      setShowAddType(false);
      setNewType({ organisation_type: "", organisation_type_code: "", organisation_category: "Medical" });
    }
  }

  // Handle unit assignment from dropdown
  const handleSelectUnit = async (newValue, actionMeta) => {
    if (!selectedType || !newValue) return;

    if (actionMeta.action === 'select-option' || actionMeta.action === 'create-option') {
        const val = newValue.value;
        let masterId = null;
        
        // If it was a create action, add to master list first
        if (actionMeta.action === 'create-option') {
            const { data: newMaster, error: mErr } = await supabase
                .from("master_organisation_units")
                .insert([{ unit_name: val }])
                .select()
                .single();
            if (!mErr) {
                setMasterUnits([...masterUnits, newMaster]);
                masterId = newMaster.id;
            }
        } else {
            masterId = masterUnits.find(m => m.unit_name === val)?.id;
        }

        // Add to junction if not already there
        if (!units.find(u => u.unit_name === val)) {
            const nextSeq = units.length > 0 ? Math.max(...units.map(u => u.sequence)) + 1 : 0;
            const { data, error } = await supabase
                .from("organisation_type_units")
                .insert([{ organisation_type_id: selectedType.organisation_type_id, unit_name: val, sequence: nextSeq }])
                .select();

            if (error) {
                toast.error("Failed to assign: " + error.message);
            } else {
                const assignedUnit = data[0];
                setUnits([...units, assignedUnit]);
                toast.success(`Unit ${val} assigned.`);

                // BLUEPRINT LOGIC: Check for defaults
                if (masterId) {
                    const { data: defaults } = await supabase
                        .from("master_unit_sub_unit_defaults")
                        .select(`
                            sequence,
                            master_organisation_sub_units (sub_unit_name)
                        `)
                        .eq("master_unit_id", masterId);

                    if (defaults && defaults.length > 0) {
                        toast("Applying standard blueprint...", { icon: '🛡️' });
                        const subsToInsert = defaults.map(d => ({
                            parent_unit_id: assignedUnit.id,
                            sub_unit_name: d.master_organisation_sub_units.sub_unit_name,
                            sequence: d.sequence
                        }));

                        const { data: insertedSubs } = await supabase
                            .from("organisation_unit_sub_units")
                            .insert(subsToInsert)
                            .select();

                        if (insertedSubs) {
                            setSubUnits(prev => ({ ...prev, [assignedUnit.id]: insertedSubs }));
                            // Automatically expand it to show the blueprint applied
                            setExpandedUnits(prev => [...prev, assignedUnit.id]);
                        }
                    }
                }
            }
        }
    }
  };

  async function handleDeleteUnit(unitId) {
      const { error } = await supabase
        .from("organisation_type_units")
        .delete()
        .eq("id", unitId);
      
      if (error) {
          toast.error("Delete failed: " + error.message);
      } else {
          setUnits(units.filter(u => u.id !== unitId));
          toast.success("Unit removed");
      }
  }

  const openEditUnit = (unit) => {
    setEditingUnit(unit);
    setEditUnitName(unit.unit_name);
    setShowEditUnit(true);
  };

  async function handleSaveEditUnit(e) {
    e.preventDefault();
    if (!editUnitName || !editingUnit) return;

    const { error } = await supabase
        .from("organisation_type_units")
        .update({ unit_name: editUnitName })
        .eq("id", editingUnit.id);

    if (error) {
        toast.error("Update failed: " + error.message);
    } else {
        toast.success("Unit renamed");
        setUnits(units.map(u => u.id === editingUnit.id ? { ...u, unit_name: editUnitName } : u));
        setShowEditUnit(false);
        setEditingUnit(null);
    }
  }

  async function handleDeleteMasterUnit(unitId) {
      if (!window.confirm("Delete this unit from the Global Master List? This will not affect existing assignments but will remove it from future selections.")) return;
      
      const { error } = await supabase
        .from("master_organisation_units")
        .delete()
        .eq("id", unitId);
      
      if (error) {
          toast.error("Delete failed: " + error.message);
      } else {
          setMasterUnits(masterUnits.filter(mu => mu.id !== unitId));
          toast.success("Unit deleted from Master List");
      }
  }

  async function handleDeleteMasterSubUnit(subUnitId) {
    if (!window.confirm("Delete this facility from the Master Pool?")) return;
    
    const { error } = await supabase
      .from("master_organisation_sub_units")
      .delete()
      .eq("id", subUnitId);
    
    if (error) {
        toast.error("Delete failed: " + error.message);
    } else {
        setMasterSubUnits(masterSubUnits.filter(ms => ms.id !== subUnitId));
        toast.success("Facility removed from Master Pool");
    }
  }

  // Simple Native Drag and Drop Implementation
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newUnits = [...units];
    const draggedItem = newUnits[draggedIndex];
    newUnits.splice(draggedIndex, 1);
    newUnits.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setUnits(newUnits);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    // Update sequences in DB
    const updates = units.map((u, i) => ({
        id: u.id,
        organisation_type_id: u.organisation_type_id,
        unit_name: u.unit_name,
        sequence: i
    }));

    const { error } = await supabase
        .from("organisation_type_units")
        .upsert(updates);

    if (error) {
        toast.error("Saved reorder failed: " + error.message);
    } else {
        toast.success("Order synchronized");
    }
  };

  // Sub-unit Drag and Drop
  const [draggedSubIndex, setDraggedSubIndex] = useState(null);
  const [draggedSubParentId, setDraggedSubParentId] = useState(null);

  const handleSubDragStart = (e, index, parentId) => {
    setDraggedSubIndex(index);
    setDraggedSubParentId(parentId);
    e.stopPropagation(); // Prevent parent drag from firing
  };

  const handleSubDragOver = (e, index, parentId) => {
    e.preventDefault();
    if (draggedSubIndex === null || draggedSubParentId !== parentId || draggedSubIndex === index) return;

    const newSubUnits = [...subUnits[parentId]];
    const draggedItem = newSubUnits[draggedSubIndex];
    newSubUnits.splice(draggedSubIndex, 1);
    newSubUnits.splice(index, 0, draggedItem);
    
    setDraggedSubIndex(index);
    setSubUnits(prev => ({ ...prev, [parentId]: newSubUnits }));
  };

  const handleSubDragEnd = async (parentId) => {
    setDraggedSubIndex(null);
    setDraggedSubParentId(null);

    const updates = subUnits[parentId].map((s, i) => ({
        id: s.id,
        parent_unit_id: s.parent_unit_id,
        sub_unit_name: s.sub_unit_name,
        sequence: i
    }));

    const { error } = await supabase
        .from("organisation_unit_sub_units")
        .upsert(updates);

    if (error) {
        toast.error("Saved sub-unit order failed: " + error.message);
    }
  };

  const unitOptions = masterUnits.map(mu => ({ value: mu.unit_name, label: mu.unit_name }));
  const subUnitOptions = masterSubUnits.map(ms => ({ value: ms.sub_unit_name, label: ms.sub_unit_name }));

  return (
    <div style={container}>
      <Toaster position="top-right" />
      <style>
        {`
          @keyframes slideFromTop {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .sub-delete-btn:hover { color: #ef4444 !important; }
        `}
      </style>
      
      <div style={hero}>
        <div style={heroText}>
          <h1 style={heroTitle}>Organisation Type Directory</h1>
          <p style={heroSub}>Define high-level templates and their constituent administrative units.</p>
        </div>
        <button style={mainActionBtn} onClick={() => setShowAddType(true)}>
          + Add New Type
        </button>
      </div>

      <div style={mainLayout}>
        {/* Left: Type List */}
        <div style={sidePanel}>
            <h3 style={panelTitle}>Available Types ({types.length})</h3>
            <div style={listContainer}>
                {types.map(t => (
                    <div 
                        key={t.organisation_type_id}
                        onClick={() => setSelectedType(t)}
                        style={{
                            ...typeCard,
                            borderColor: selectedType?.organisation_type_id === t.organisation_type_id ? "#3b82f6" : "transparent",
                            background: selectedType?.organisation_type_id === t.organisation_type_id ? "#eff6ff" : "white",
                        }}
                    >
                        <span style={typeName}>{t.organisation_type}</span>
                        <span style={typeCategory}>{t.organisation_category}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Right: Unit Composition */}
        <div style={contentArea}>
            {selectedType ? (
                <>
                    <div style={header}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={selectedTitle}>{selectedType.organisation_type}</h2>
                                <p style={selectedSub}>Constituent Hierarchy & Ordering</p>
                            </div>
                            <div style={typeBadgeTag}>{selectedType.organisation_type_code}</div>
                        </div>
                    </div>

                    <div style={unitGridContainer}>
                        <div style={managerLayout}>
                            <div style={selectionBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={smallHeader}>SELECT ORGANISATION UNIT</h4>
                                    <button 
                                        onClick={() => setShowManageMaster(true)}
                                        style={managePoolBtn}
                                    >
                                        Manage Pool
                                    </button>
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                    <CreatableSelect
                                        isClearable
                                        placeholder="Pick a unit..."
                                        options={unitOptions}
                                        onChange={handleSelectUnit}
                                        formatCreateLabel={(inputValue) => `+ Add "${inputValue}"`}
                                        createOptionPosition="last"
                                        styles={customSelectStyles}
                                        value={null}
                                    />
                                    <p style={helpText}>Selected units will appear on the right for reordering.</p>
                                </div>
                            </div>

                            <div style={unitsListWrapper}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4 style={smallHeader}>ASSIGNED UNITS & SEQUENCE</h4>
                                    <span style={hintText}>Drag to reorder</span>
                                </div>
                                
                                <div style={dragList}>
                                    {units.length === 0 ? (
                                        <div style={emptyPlaceholderSmall}>
                                            <p>No units assigned.</p>
                                        </div>
                                    ) : (
                                        units.map((u, index) => (
                                            <div key={u.id}>
                                             <div 
                                                 draggable
                                                 onDragStart={(e) => handleDragStart(e, index)}
                                                 onDragOver={(e) => handleDragOver(e, index)}
                                                 onDragEnd={handleDragEnd}
                                                 style={{
                                                     ...unitDraggableCard,
                                                     opacity: draggedIndex === index ? 0.5 : 1,
                                                     borderColor: draggedIndex === index ? "#3b82f6" : "#e2e8f0",
                                                 }}
                                             >
                                                 <button 
                                                     style={expandToggleBtn} 
                                                     onClick={() => toggleExpandUnit(u.id)}
                                                 >
                                                     {expandedUnits.includes(u.id) ? "▼" : "▶"}
                                                 </button>
                                                 <div style={{ flex: 1, fontWeight: '700', fontSize: '14px' }}>{u.unit_name}</div>
                                                 <div style={{ display: 'flex', gap: '8px' }}>
                                                     <button style={editActionBtnSmall} onClick={() => openEditUnit(u)}>✎</button>
                                                     <button style={deleteActionBtnSmall} onClick={() => handleDeleteUnit(u.id)}>×</button>
                                                 </div>
                                             </div>

                                             {/* Tier 3: Sub-Units Area */}
                                             {expandedUnits.includes(u.id) && (
                                                 <div style={subUnitPool}>
                                                     <div style={subUnitHeader}>CONSTITUENT FACILITIES</div>
                                                     <div style={subUnitList}>
                                                         {(subUnits[u.id] || []).map((s, sIdx) => (
                                                             <React.Fragment key={s.id}>
                                                             <div 
                                                                 draggable
                                                                 onDragStart={(e) => handleSubDragStart(e, sIdx, u.id)}
                                                                 onDragOver={(e) => handleSubDragOver(e, sIdx, u.id)}
                                                                 onDragEnd={() => handleSubDragEnd(u.id)}
                                                                 style={subUnitDraggableItem}
                                                             >
                                                                 <div style={subDragHandle}>⠿</div>
                                                                 <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span>{s.sub_unit_name}</span>
                                                                    {masterSubUnits.find(m => m.sub_unit_name === s.sub_unit_name)?.required_area && (
                                                                        <span style={areaTag}>
                                                                            {masterSubUnits.find(m => m.sub_unit_name === s.sub_unit_name).required_area} {masterSubUnits.find(m => m.sub_unit_name === s.sub_unit_name).area_uom}
                                                                        </span>
                                                                    )}
                                                                 </div>
                                                                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                                    <button 
                                                                        style={resourceToggleBtn}
                                                                        onClick={() => toggleExpandSub(s)}
                                                                    >
                                                                        📋 Resources
                                                                    </button>
                                                                    <button 
                                                                        style={resourceToggleBtn}
                                                                        onClick={() => fetchAuditHistory(s)}
                                                                    >
                                                                        📜 History
                                                                    </button>
                                                                    <button 
                                                                        className="sub-delete-btn"
                                                                        style={subDeleteBtn} 
                                                                        onClick={() => handleDeleteSubUnit(s.id, u.id)}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                 </div>
                                                             </div>
                                                             
                                                             {/* Map Section */}
                                                             <div style={mapSection}>
                                                                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                                    <span style={mapLabel}>Actual Floor Plan:</span>
                                                                    <input 
                                                                        placeholder="URL to map..."
                                                                        style={mapInput}
                                                                        value={s.actual_floor_plan_url || ''}
                                                                        onChange={(e) => {
                                                                            // Logic to save map URL
                                                                        }}
                                                                    />
                                                                    {s.actual_floor_plan_url && (
                                                                        <button style={viewMapBtn} onClick={() => window.open(s.actual_floor_plan_url, '_blank')}>
                                                                            📐 View Layout
                                                                        </button>
                                                                    )}
                                                                 </div>
                                                             </div>
                                                             
                                                             {/* Resource Blueprint Display */}
                                                             {expandedSubs.includes(s.id) && (
                                                                 <div style={resourceMatrix}>
                                                                     <div style={resourceGrid}>
                                                                         {['Inventory', 'Human', 'Workflow'].map(type => (
                                                                             <div key={type} style={resourceColumn}>
                                                                                 <div style={resourceColHeader}>{type}</div>
                                                                                 <div style={resourceList}>
                                                                                     {(unitResources[s.id] || [])
                                                                                        .filter(r => r.resource_type === type)
                                                                                        .map((r, i) => (
                                                                                            <div key={i} style={resourceItem}>
                                                                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                                                    <span style={{ fontWeight: '700' }}>{r.resource_name}</span>
                                                                                                    <span style={{ fontSize: '9px', opacity: 0.6 }}>Requirement: {r.quantity}</span>
                                                                                                </div>
                                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                                    <input 
                                                                                                        type="number"
                                                                                                        style={allocInput}
                                                                                                        value={(actualAllocations[s.id] || {})[r.id] ?? 0}
                                                                                                        onChange={(e) => handleUpdateAllocation(s.id, r.id, r.resource_name, e.target.value)}
                                                                                                    />
                                                                                                    <span style={{
                                                                                                        ...statusDot,
                                                                                                        backgroundColor: ((actualAllocations[s.id] || {})[r.id] ?? 0) >= r.quantity ? '#10b981' : (r.is_mandatory ? '#ef4444' : '#f59e0b')
                                                                                                    }}></span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))
                                                                                     }
                                                                                     {!(unitResources[s.id] || []).some(r => r.resource_type === type) && (
                                                                                         <div style={noneText}>None specified</div>
                                                                                     )}
                                                                                 </div>
                                                                             </div>
                                                                         ))}
                                                                     </div>
                                                                 </div>
                                                             )}
                                                             </React.Fragment>
                                                         ))}
                                                     </div>
                                                     <div style={subUnitHeader}>MANAGE COMPOSITION</div>
                                                     <div style={subUnitInputWrap}>
                                                         <div style={{ flex: 1 }}>
                                                            <CreatableSelect
                                                                isClearable
                                                                placeholder="Add lab/hall..."
                                                                options={subUnitOptions}
                                                                styles={subSelectStyles}
                                                                value={null}
                                                                onChange={(opt, meta) => handleAddSubUnit(u.id, opt?.value)}
                                                                formatCreateLabel={(val) => `+ New "${val}"`}
                                                            />
                                                         </div>
                                                         <button 
                                                            style={managePoolBtn}
                                                            onClick={() => setShowManageMasterSubs(true)}
                                                         >
                                                             Pool
                                                         </button>
                                                     </div>
                                                 </div>
                                             )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div style={emptyState}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>🏛️</div>
                    <p>Select an organisation type to manage its constituent units.</p>
                </div>
            )}
        </div>
      </div>

      {showAddType && (
          <div style={modalOverlay}>
              <div style={modalContent}>
                  <h3 style={modalTitle}>Define Organisation Type</h3>
                  <form onSubmit={handleAddType} style={form}>
                      <div style={inputGroup}>
                          <label style={label}>Type Name</label>
                          <input 
                            style={input} 
                            placeholder="e.g. Medical College" 
                            value={newType.organisation_type}
                            onChange={e => setNewType({ ...newType, organisation_type: e.target.value })}
                          />
                      </div>
                      <div style={inputGroup}>
                          <label style={label}>Unique Code</label>
                          <input 
                            style={input} 
                            placeholder="e.g. MC" 
                            value={newType.organisation_type}
                            onChange={e => setNewType({ ...newType, organisation_type_code: e.target.value })}
                          />
                      </div>
                      <div style={modalActions}>
                        <button type="button" style={secondaryBtn} onClick={() => setShowAddType(false)}>Cancel</button>
                        <button type="submit" style={primaryBtn}>Create Type</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {showEditUnit && editingUnit && (
          <div style={modalOverlay}>
              <div style={modalContent}>
                  <h3 style={modalTitle}>Edit Organisation Unit</h3>
                  <form onSubmit={handleSaveEditUnit} style={form}>
                      <div style={inputGroup}>
                          <label style={label}>Unit Name</label>
                          <input 
                            style={input} 
                            value={editUnitName}
                            onChange={e => setEditUnitName(e.target.value)}
                            autoFocus
                          />
                      </div>
                      <div style={modalActions}>
                        <button type="button" style={secondaryBtn} onClick={() => setShowEditUnit(false)}>Cancel</button>
                        <button type="submit" style={primaryBtn}>Save Changes</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      {showManageMaster && (
          <div style={modalOverlay}>
              <div style={modalContentLarge}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ ...modalTitle, margin: 0 }}>Master Unit Directory</h3>
                    <button style={secondaryBtn} onClick={() => setShowManageMaster(false)}>Close</button>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                      Deleting a unit here removes it from the selection dropdown globally. 
                  </p>
                  <div style={masterListGrid}>
                      {masterUnits.length === 0 ? (
                          <p>No master units defined.</p>
                      ) : (
                          masterUnits.map(mu => (
                              <div key={mu.id} style={masterUnitItem}>
                                  <span style={{ fontWeight: '600' }}>{mu.unit_name}</span>
                                  <button 
                                    style={deleteActionBtnSmall} 
                                    onClick={() => handleDeleteMasterUnit(mu.id)}
                                  >
                                    ×
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {showAuditHistory && (
          <div style={modalOverlay}>
              <div style={modalContentLarge}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ ...modalTitle, margin: 0 }}>Allocation History: {historyTarget?.name}</h3>
                    <button style={secondaryBtn} onClick={() => setShowAuditHistory(false)}>Close</button>
                  </div>
                  <div style={auditTimeline}>
                      {auditLogs.length === 0 ? (
                          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No history found for this facility.</div>
                      ) : (
                        auditLogs.map((log, lIdx) => (
                            <div key={lIdx} style={auditRecord}>
                                <div style={auditDate}>{new Date(log.created_at).toLocaleString()}</div>
                                <div style={auditBody}>
                                    <span style={{ fontWeight: '800', color: '#1e293b' }}>{log.resource_name}</span>
                                    <span style={{ color: '#64748b' }}> was updated from </span>
                                    <span style={oldValue}>{log.old_qty}</span>
                                    <span style={{ color: '#64748b' }}> → </span>
                                    <span style={newValue}>{log.new_qty}</span>
                                </div>
                                <div style={auditAction}>{log.change_type}</div>
                            </div>
                        ))
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

// STYLES
const container = { padding: "0", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" };
const hero = { padding: "40px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" };
const heroText = { display: "flex", flexDirection: "column", gap: "4px" };
const heroTitle = { margin: 0, fontSize: "32px", fontWeight: "900", letterSpacing: "-1px" };
const heroSub = { margin: "0", color: "#94a3b8", fontSize: "16px" };
const mainActionBtn = { background: "#3b82f6", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' };

const mainLayout = { display: "grid", gridTemplateColumns: "350px 1fr", height: "calc(100vh - 150px)" };
const sidePanel = { background: "white", borderRight: "1px solid #e2e8f0", padding: "30px", overflowY: "auto" };
const panelTitle = { margin: "0 0 20px 0", fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "800", letterSpacing: "1px" };
const listContainer = { display: "flex", flexDirection: "column", gap: "10px" };

const typeCard = { padding: "20px", borderRadius: "16px", border: "2px solid transparent", cursor: "pointer", transition: "all 0.2s", display: 'flex', flexDirection: 'column', gap: '4px' };
const typeName = { display: "block", fontSize: "16px", fontWeight: "800", color: "#1e293b" };
const typeCategory = { fontSize: "10px", color: "#3b82f6", textTransform: "uppercase", fontWeight: "700", background: '#eff6ff', alignSelf: 'flex-start', padding: '2px 8px', borderRadius: '4px' };

const contentArea = { padding: "50px", overflowY: "auto", background: '#fdfdfd' };
const header = { marginBottom: "40px" };
const selectedTitle = { margin: 0, fontSize: "32px", fontWeight: "900", color: "#0f172a", letterSpacing: '-1px' };
const selectedSub = { margin: "6px 0 0 0", color: "#64748b", fontSize: "15px", fontWeight: '500' };
const typeBadgeTag = { background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '800' };

const unitGridContainer = { display: "flex", flexDirection: "column", gap: "40px" };
const managerLayout = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "start" };
const selectionBox = { background: "white", padding: "30px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 10px rgba(0,0,0,0.03)" };
const smallHeader = { margin: "0", fontSize: "11px", fontWeight: "800", color: "#94a3b8", letterSpacing: '1px' };
const helpText = { marginTop: '12px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' };

const unitsListWrapper = { padding: "0" };
const hintText = { fontSize: '11px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase' };
const dragList = { display: "flex", flexDirection: "column", gap: "10px" };

const unitDraggableCard = { 
    background: "white", 
    border: "1px solid #e2e8f0", 
    padding: "12px 16px", 
    borderRadius: "14px", 
    display: "flex", 
    alignItems: "center", 
    gap: "16px", 
    cursor: "grab", 
    transition: "all 0.1s ease", 
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
};
const dragHandle = { fontSize: '18px', color: '#cbd5e1', userSelect: 'none' };
const expandToggleBtn = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0 4px', fontSize: '12px', transition: 'transform 0.2s' };
const editActionBtnSmall = { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", display: 'flex', alignItems: 'center', justifyContent: 'center' };
const deleteActionBtnSmall = { background: "#fee2e2", color: "#ef4444", border: "none", width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", display: 'flex', alignItems: 'center', justifyContent: 'center' };

const subUnitPool = { marginLeft: '20px', marginTop: '-4px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 14px 14px', animation: 'slideFromTop 0.2s ease-out' };
const subUnitHeader = { fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.5px' };
const subUnitList = { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' };
const subUnitDraggableItem = { background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', cursor: 'grab' };
const subDragHandle = { color: '#cbd5e1', fontSize: '14px' };
const subDeleteBtn = { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '16px', padding: '0 4px', '&:hover': { color: '#ef4444' } };
const subUnitInputWrap = { display: 'flex', gap: '8px' };
const subUnitInput = { flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' };
const areaTag = { fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' };
const resourceToggleBtn = { background: 'none', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' };

const resourceMatrix = { marginLeft: '24px', marginRight: '4px', marginBottom: '8px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: 'none', animation: 'slideFromTop 0.2s ease-out' };
const resourceGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' };
const resourceColumn = { display: 'flex', flexDirection: 'column', gap: '8px' };
const resourceColHeader = { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' };
const resourceList = { display: 'flex', flexDirection: 'column', gap: '4px' };
const resourceItem = { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', background: '#f8fafc', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const allocInput = { width: '40px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: '800', textAlign: 'center', outline: 'none' };
const statusDot = { width: '8px', height: '8px', borderRadius: '50%' };
const mapSection = { marginLeft: '24px', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none', borderBottom: 'none', display: 'flex' };
const mapLabel = { fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' };
const mapInput = { flex: 1, border: 'none', background: 'transparent', fontSize: '11px', outline: 'none', color: '#3b82f6', textDecoration: 'underline' };
const viewMapBtn = { padding: '2px 8px', borderRadius: '6px', border: '1px solid #3b82f6', color: '#3b82f6', fontSize: '10px', fontWeight: '800', cursor: 'pointer', background: 'white' };

const qtyBadge = { background: '#e2e8f0', color: '#475569', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' };
const mandatoryDot = { color: '#ef4444', fontSize: '8px' };
const noneText = { fontSize: '10px', color: '#cbd5e1', fontStyle: 'italic' };

const subAddBtn = { background: '#3b82f6', color: 'white', border: 'none', padding: '0 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' };

const emptyPlaceholderSmall = { padding: '40px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '16px', fontSize: '13px' };
const emptyState = { display: "flex", flexDirection: 'column', alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" };

const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { background: "white", padding: "40px", borderRadius: "28px", width: "450px", boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const modalContentLarge = { background: "white", padding: "40px", borderRadius: "32px", width: "650px", maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const modalTitle = { marginTop: 0, fontSize: "28px", fontWeight: "900", marginBottom: "24px", letterSpacing: '-0.5px' };
const managePoolBtn = { background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' };
const masterListGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const masterUnitItem = { background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' };

const auditTimeline = { display: 'flex', flexDirection: 'column', gap: '12px' };
const auditRecord = { background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' };
const auditDate = { fontSize: '11px', fontWeight: '800', color: '#94a3b8', minWidth: '150px' };
const auditBody = { flex: 1, fontSize: '14px' };
const auditAction = { fontSize: '10px', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' };
const oldValue = { color: '#ef4444', fontWeight: 'bold' };
const newValue = { color: '#10b981', fontWeight: 'bold' };

const form = { display: "flex", flexDirection: "column", gap: "20px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
const label = { fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: 'uppercase' };
const input = { padding: "14px", borderRadius: "12px", border: "1px solid #d1d5db", outline: "none", background: '#f8fafc' };
const modalActions = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" };
const primaryBtn = { background: "#3b82f6", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" };
const secondaryBtn = { background: "#f1f5f9", color: "#475569", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" };

const customSelectStyles = {
    control: (base) => ({
        ...base,
        borderRadius: '12px',
        padding: '3px',
        borderColor: '#e2e8f0',
        boxShadow: 'none',
        '&:hover': {
            borderColor: '#3b82f6'
        }
    }),
    option: (base, state) => ({
        ...base,
        fontSize: '14px',
        fontWeight: '600',
        backgroundColor: state.isFocused ? '#eff6ff' : 'white',
        color: state.isFocused ? '#3b82f6' : '#1e293b'
    })
};

const subSelectStyles = {
    control: (base) => ({
        ...base,
        borderRadius: '10px',
        padding: '0px',
        fontSize: '13px',
        borderColor: '#e2e8f0',
        minHeight: '36px',
        boxShadow: 'none',
        '&:hover': {
            borderColor: '#3b82f6'
        }
    }),
    option: (base, state) => ({
        ...base,
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: state.isFocused ? '#eff6ff' : 'white',
        color: state.isFocused ? '#3b82f6' : '#1e293b'
    })
};
