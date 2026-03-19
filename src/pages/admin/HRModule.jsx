import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

export default function HRModule() {
    const [loading, setLoading] = useState(true);

    const [orgTypes, setOrgTypes] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [mappedDesignationIds, setMappedDesignationIds] = useState([]);

    const [selectedOrgTypeId, setSelectedOrgTypeId] = useState("");
    const [selectedDesignationToAdd, setSelectedDesignationToAdd] = useState("");

    // Merge duplicate states
    const [mergeSourceOrgType, setMergeSourceOrgType] = useState("");
    const [mergeTargetOrgType, setMergeTargetOrgType] = useState("");
    const [mergeSourceDesignation, setMergeSourceDesignation] = useState("");
    const [mergeTargetDesignation, setMergeTargetDesignation] = useState("");

    // Designation Creator State
    const [creatorSubject, setCreatorSubject] = useState("");
    const [creatorRole, setCreatorRole] = useState("");
    const [isTeaching, setIsTeaching] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        loadMasterData();
    }, []);

    async function loadMasterData() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            let profile = null;
            if (user) {
                const { data: p } = await supabase.schema("core").from("profiles").select("*").eq("id", user.id).single();
                profile = p;
                setUserProfile(p);
            }

            let typesQuery = supabase.from("organisation_types").select("*").order("organisation_type");
            let desigQuery = supabase.from("designations").select("*").order("designation_name");

            if (profile?.role === 'TENANT_ADMIN' || profile?.role === 'ORG_ADMIN') {
                const level = profile.role === 'TENANT_ADMIN' ? 'TENANT' : 'ORGANISATION';
                const selectionTable = level === 'TENANT' ? 'tenant_master_selections' : 'organisation_master_selections';
                const filterCol = level === 'TENANT' ? 'tenant_id' : 'organisation_id';
                const entityId = level === 'TENANT' ? profile.tenant_id : profile.organisation_id;

                const { data: selections } = await supabase.schema('core').from(selectionTable).select('master_id').eq(filterCol, entityId).eq('master_type', 'designation');
                if (selections) {
                    const ids = selections.map(s => s.master_id);
                    if (ids.length > 0) desigQuery = desigQuery.in('designation_id', ids);
                    else { setDesignations([]); }
                }
            }

            const { data: typesData } = await typesQuery;
            const { data: desigData } = await desigQuery;

            setOrgTypes(typesData || []);
            setDesignations(desigData || []);

            if (typesData?.length > 0 && !selectedOrgTypeId) {
                setSelectedOrgTypeId(typesData[0].organisation_type_id);
            }
        } catch (error) {
            toast.error("Error loading master data: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        async function loadMapping() {
            if (!selectedOrgTypeId) return;
            try {
                const { data } = await supabase
                    .from("org_type_designations")
                    .select("designation_id")
                    .eq("organisation_type_id", selectedOrgTypeId);

                setMappedDesignationIds((data || []).map(r => r.designation_id));
            } catch (e) {
                toast.error("Error loading mapping");
            }
        }
        loadMapping();
    }, [selectedOrgTypeId]);

    const handleCreateDesignation = async () => {
        if (!creatorRole) {
            toast.error("Designation Role is required!");
            return;
        }

        const finalName = creatorSubject ? `${creatorSubject} - ${creatorRole}` : creatorRole;

        // Prevent duplicate designations
        if (designations.some(d => d.designation_name.toLowerCase() === finalName.toLowerCase())) {
            toast.error(`Designation '${finalName}' already exists!`);
            return;
        }

        setIsCreating(true);
        try {
            const code = `CUST_${finalName.substring(0, 15).replace(/[^A-Za-z0-9]/g, '').toUpperCase()}_${Date.now().toString().slice(-4)}`;

            const { error } = await supabase
                .from("designations")
                .insert({
                    designation_name: finalName,
                    designation_code: code,
                    designation_group: isTeaching ? 'TEACHING_FACULTY' : 'NON_TEACHING',
                    is_teaching: isTeaching,
                    is_active: true
                });

            if (error) throw error;

            toast.success(`Designation '${finalName}' created!`);
            setCreatorSubject("");
            setCreatorRole("");

            await loadMasterData(); // Refresh the dropdowns
        } catch (e) {
            toast.error("Failed to create designation: " + e.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleOrgTypeChange = async (newValue) => {
        if (!newValue) {
            setSelectedOrgTypeId("");
            return;
        }

        if (newValue.__isNew__) {
            try {
                const orgTypeName = newValue.label;
                const orgTypeCode = orgTypeName.substring(0, 15).replace(/[^A-Za-z0-9]/g, '').toUpperCase() + '_' + Date.now().toString().slice(-4);

                const { data, error } = await supabase
                    .from("organisation_types")
                    .insert({
                        organisation_type: orgTypeName,
                        organisation_type_code: orgTypeCode
                    })
                    .select()
                    .single();

                if (error) throw error;

                toast.success(`Organisation Type '${orgTypeName}' created!`);
                setOrgTypes(prev => [...prev, data]);
                setSelectedOrgTypeId(data.organisation_type_id);
            } catch (e) {
                toast.error("Failed to create org type: " + e.message);
            }
        } else {
            setSelectedOrgTypeId(newValue.value);
        }
    };

    const addMapping = async () => {
        if (!selectedOrgTypeId || !selectedDesignationToAdd) return;

        try {
            const { error } = await supabase
                .from("org_type_designations")
                .insert({
                    organisation_type_id: selectedOrgTypeId,
                    designation_id: selectedDesignationToAdd
                });

            if (error) {
                if (error.code === '23505') toast.error("Already mapped!");
                else throw error;
            } else {
                setMappedDesignationIds(prev => [...prev, selectedDesignationToAdd]);
                toast.success("Designation allowed for Org Type");
                setSelectedDesignationToAdd("");
            }
        } catch (e) {
            toast.error("Failed to map designation.");
        }
    };

    const removeMapping = async (designationId) => {
        try {
            await supabase
                .from("org_type_designations")
                .delete()
                .match({ organisation_type_id: selectedOrgTypeId, designation_id: designationId });

            setMappedDesignationIds(prev => prev.filter(id => id !== designationId));
            toast.success("Removed access successfully");
        } catch (e) {
            toast.error("Failed to remove mapping.");
        }
    };


    const mergeOrgType = async () => {
        if (!mergeSourceOrgType || !mergeTargetOrgType) return;
        if (mergeSourceOrgType === mergeTargetOrgType) {
            toast.error("Source and target must be different!");
            return;
        }

        const sourceName = orgTypes.find(t => t.organisation_type_id === mergeSourceOrgType)?.organisation_type;
        const targetName = orgTypes.find(t => t.organisation_type_id === mergeTargetOrgType)?.organisation_type;

        if (!window.confirm(`Merge '${sourceName}' INTO '${targetName}'? \n\nThis will reallocate all associations and DELETE the duplicate '${sourceName}'. \n\nThis cannot be undone.`)) return;

        try {
            setLoading(true);

            const { error } = await supabase.rpc("merge_organisation_types", {
                source_id: mergeSourceOrgType,
                target_id: mergeTargetOrgType
            });

            if (error) throw error;

            toast.success(`Merged successfully. '${sourceName}' has been deleted!`);
            setMergeSourceOrgType("");
            setMergeTargetOrgType("");
            await loadMasterData();
        } catch (e) {
            toast.error("Merge failed: Please execute 'admin_merge_rpcs.sql' in your Supabase SQL Editor. Error details: " + e.message);
        } finally { setLoading(false); }
    };


    const mergeDesignation = async () => {
        if (!mergeSourceDesignation || !mergeTargetDesignation) return;
        if (mergeSourceDesignation === mergeTargetDesignation) {
            toast.error("Source and target must be different!");
            return;
        }

        const sourceName = designations.find(d => d.designation_id === mergeSourceDesignation)?.designation_name;
        const targetName = designations.find(d => d.designation_id === mergeTargetDesignation)?.designation_name;

        if (!window.confirm(`Merge '${sourceName}' INTO '${targetName}'? \n\nThis will reallocate all linkages and DELETE the duplicate '${sourceName}'. \n\nThis cannot be undone.`)) return;

        try {
            setLoading(true);

            const { error } = await supabase.rpc("merge_designations", {
                source_id: mergeSourceDesignation,
                target_id: mergeTargetDesignation
            });

            if (error) throw error;

            toast.success(`Merged successfully. '${sourceName}' has been deleted!`);
            setMergeSourceDesignation("");
            setMergeTargetDesignation("");
            await loadMasterData();
        } catch (e) {
            toast.error("Merge failed: Please execute 'admin_merge_rpcs.sql' in your Supabase SQL Editor. Error details: " + e.message);
        } finally { setLoading(false); }
    };

    const unmappedDesignations = designations.filter(d => !mappedDesignationIds.includes(d.designation_id));
    const mappedDesignationObjects = mappingsData();

    function mappingsData() {
        // Return objects of mapped designations sorted
        return mappedDesignationIds
            .map(id => designations.find(d => d.designation_id === id))
            .filter(Boolean)
            .sort((a, b) => a.designation_name.localeCompare(b.designation_name));
    }

    const uniqueSubjects = new Set();
    const uniqueRoles = new Set();

    designations.forEach(d => {
        if (d.designation_name.includes(" - ")) {
            const parts = d.designation_name.split(" - ");
            const subject = parts.slice(0, -1).join(" - ").trim();
            const role = parts[parts.length - 1].trim();
            if (subject) uniqueSubjects.add(subject);
            if (role) uniqueRoles.add(role);
        } else {
            uniqueRoles.add(d.designation_name.trim());
        }
    });

    const subjectOptions = Array.from(uniqueSubjects).sort().map(s => ({ value: s, label: s }));
    const roleOptions = Array.from(uniqueRoles).sort().map(r => ({ value: r, label: r }));

    return (
        <div style={container}>
            <Toaster />
            <div style={header}>
                <div>
                    <h2 style={title}>HR Settings & Global Taxonomy</h2>
                    <p style={subtitle}>Manage master designations and control organisation type permissions.</p>
                </div>
            </div>

            <div style={grid}>

                {/* DESIGNATION CREATOR SECTION */}
                <div style={card}>
                    <div style={cardHeader}>
                        <h3 style={cardTitle}>1. Create New Designation</h3>
                        <span style={pillBadge}>Taxonomy Builder</span>
                    </div>

                    <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                        System-wide designations are formed by combining an optional Subject with a Base Role. (e.g., "Ophthalmology" + "Junior Resident").
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div style={inputGroup}>
                            <label style={label}>Subject / Department <span style={{ color: "#94a3b8", fontWeight: "normal" }}>(Optional)</span></label>
                            <CreatableSelect
                                isClearable
                                placeholder="e.g. Ophthalmology (Select or Type)"
                                formatCreateLabel={(inputValue) => `Add if not available: "${inputValue}"`}
                                options={subjectOptions}
                                value={creatorSubject ? { value: creatorSubject, label: creatorSubject } : null}
                                onChange={(newValue) => setCreatorSubject(newValue ? newValue.value : "")}
                                styles={{ control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#cbd5e1', padding: '2px', fontSize: '14px' }) }}
                            />
                        </div>

                        <div style={inputGroup}>
                            <label style={label}>Base Role / Designation Type <span style={{ color: "#ef4444" }}>*</span></label>
                            <CreatableSelect
                                isClearable
                                placeholder="e.g. Junior Resident (Select or Type)"
                                formatCreateLabel={(inputValue) => `Add if not available: "${inputValue}"`}
                                options={roleOptions}
                                value={creatorRole ? { value: creatorRole, label: creatorRole } : null}
                                onChange={(newValue) => setCreatorRole(newValue ? newValue.value : "")}
                                styles={{ control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#cbd5e1', padding: '2px', fontSize: '14px' }) }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                type="checkbox"
                                id="isTeaching"
                                checked={isTeaching}
                                onChange={e => setIsTeaching(e.target.checked)}
                            />
                            <label htmlFor="isTeaching" style={{ fontSize: "14px", color: "#334155", cursor: "pointer" }}>Is this a Teaching / Academic role?</label>
                        </div>

                        <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", marginTop: "10px" }}>
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" }}>Final Title Preview</div>
                            <div style={{ fontSize: "16px", color: "#0f172a", marginTop: "4px" }}>
                                {creatorSubject ? `${creatorSubject} - ${creatorRole}` : (creatorRole || "Type something...")}
                            </div>
                        </div>

                        <button
                            style={{ ...primaryBtn, width: "100%", marginTop: "10px" }}
                            onClick={handleCreateDesignation}
                            disabled={isCreating}
                        >
                            {isCreating ? "Creating..." : "+ Create System Designation"}
                        </button>
                    </div>
                </div>

                {/* ORG TYPE MAPPER SECTION */}
                <div style={card}>
                    <div style={cardHeader}>
                        <h3 style={cardTitle}>2. Organisation Permissions Matrix</h3>
                        <span style={pillBadgeBlue}>Access Control</span>
                    </div>

                    <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                        Select an Organisation Type to define which Designations its HR Admins are permitted to hire for.
                    </p>

                    {loading ? <p>Loading data...</p> : (
                        <>
                            {/* Select Org Type */}
                            <div style={{ ...inputGroup, marginBottom: "20px" }}>
                                <label style={label}>Target Organisation Type</label>
                                <CreatableSelect
                                    placeholder="-- Select or Add Org Type --"
                                    formatCreateLabel={(inputValue) => `Add if not available: "${inputValue}"`}
                                    options={orgTypes.map(t => ({ value: t.organisation_type_id, label: t.organisation_type }))}
                                    value={selectedOrgTypeId ? { value: selectedOrgTypeId, label: orgTypes.find(t => t.organisation_type_id === selectedOrgTypeId)?.organisation_type || '' } : null}
                                    onChange={handleOrgTypeChange}
                                    styles={{ control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#bfdbfe', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', padding: '2px', fontSize: '14px' }) }}
                                />
                            </div>

                            {/* Select Designation To Add */}
                            <div style={{ ...inputGroup, marginBottom: "24px" }}>
                                <label style={label}>Grant Access to Designation</label>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div style={{ flex: 1 }}>
                                        <Select
                                            isClearable
                                            placeholder={`-- Choose from ${unmappedDesignations.length} available --`}
                                            options={unmappedDesignations.map(d => ({ value: d.designation_id, label: d.designation_name }))}
                                            value={selectedDesignationToAdd ? { value: selectedDesignationToAdd, label: designations.find(d => d.designation_id === selectedDesignationToAdd)?.designation_name } : null}
                                            onChange={(newValue) => setSelectedDesignationToAdd(newValue ? newValue.value : "")}
                                            styles={{ control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#cbd5e1', padding: '2px', fontSize: '14px' }) }}
                                        />
                                    </div>
                                    <button
                                        style={{ ...secondaryBtn, whiteSpace: "nowrap" }}
                                        onClick={addMapping}
                                    >
                                        Allow Access →
                                    </button>
                                </div>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "0 0 20px 0" }} />

                            {/* Display Mapped Designations */}
                            <label style={{ ...label, marginBottom: "10px", display: "block" }}>
                                Permitted Roles for this Org Type ({mappedDesignationObjects.length})
                            </label>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "300px", overflowY: "auto", padding: "10px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                {mappedDesignationObjects.length === 0 ? (
                                    <div style={{ color: "#94a3b8", fontSize: "14px", width: "100%", textAlign: "center", padding: "20px 0" }}>
                                        No designations permitted yet.
                                    </div>
                                ) : (
                                    mappedDesignationObjects.map(d => (
                                        <div key={d.designation_id} style={chip}>
                                            <span style={{ fontSize: "13px", fontWeight: "500", color: "#334155" }}>{d.designation_name}</span>
                                            <button
                                                style={chipRemoveBtn}
                                                onClick={() => removeMapping(d.designation_id)}
                                                title="Revoke Access"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

            </div>

            {/* SYSTEM DATA CLEANUP ZONE */}
            <div style={{ ...card, marginTop: "24px", gridColumn: "1 / -1", borderTop: "4px solid #f87171" }}>
                <div style={cardHeader}>
                    <h3 style={{ ...cardTitle, color: "#991b1b" }}>3. Master Data Cleanup & Deduplication</h3>
                    <span style={{ ...pillBadge, backgroundColor: "#fee2e2", color: "#ef4444" }}>Admin Utilities</span>
                </div>

                <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                    Identify duplicate or incorrect master entries and safely reallocate all associations (Departments, Employees, Designations) into the correct target before automatically deleting the duplicate.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>

                    {/* Merge Designations Container */}
                    <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <label style={{ ...label, color: "#334155", display: "block", marginBottom: "10px" }}>Merge Designations</label>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <Select
                                placeholder="1. Select WRONG Duplicate..."
                                options={designations.map(d => ({ value: d.designation_id, label: `WRONG: ${d.designation_name}` }))}
                                value={mergeSourceDesignation ? { value: mergeSourceDesignation, label: "WRONG: " + designations.find(d => d.designation_id === mergeSourceDesignation)?.designation_name } : null}
                                onChange={(newValue) => setMergeSourceDesignation(newValue ? newValue.value : "")}
                                styles={{ control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }) }}
                            />

                            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", fontWeight: "bold" }}>↓ MOVES INTO ↓</div>

                            <Select
                                placeholder="2. Select CORRECT Target..."
                                options={designations.map(d => ({ value: d.designation_id, label: `TARGET: ${d.designation_name}` }))}
                                value={mergeTargetDesignation ? { value: mergeTargetDesignation, label: "TARGET: " + designations.find(d => d.designation_id === mergeTargetDesignation)?.designation_name } : null}
                                onChange={(newValue) => setMergeTargetDesignation(newValue ? newValue.value : "")}
                                styles={{ control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#86efac', backgroundColor: '#f0fdf4' }) }}
                            />

                            <button
                                style={{ ...primaryBtn, backgroundColor: "#0f172a", marginTop: "10px", opacity: (mergeSourceDesignation && mergeTargetDesignation) ? 1 : 0.5 }}
                                onClick={mergeDesignation}
                                disabled={!mergeSourceDesignation || !mergeTargetDesignation}
                            >
                                Execute Merge & Cleanup
                            </button>
                        </div>
                    </div>


                    {/* Merge Org Types Container */}
                    <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <label style={{ ...label, color: "#334155", display: "block", marginBottom: "10px" }}>Merge Organisation Types</label>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <Select
                                placeholder="1. Select WRONG Duplicate..."
                                options={orgTypes.map(t => ({ value: t.organisation_type_id, label: `WRONG: ${t.organisation_type}` }))}
                                value={mergeSourceOrgType ? { value: mergeSourceOrgType, label: "WRONG: " + orgTypes.find(t => t.organisation_type_id === mergeSourceOrgType)?.organisation_type } : null}
                                onChange={(newValue) => setMergeSourceOrgType(newValue ? newValue.value : "")}
                                styles={{ control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }) }}
                            />

                            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", fontWeight: "bold" }}>↓ MOVES INTO ↓</div>

                            <Select
                                placeholder="2. Select CORRECT Target..."
                                options={orgTypes.map(t => ({ value: t.organisation_type_id, label: `TARGET: ${t.organisation_type}` }))}
                                value={mergeTargetOrgType ? { value: mergeTargetOrgType, label: "TARGET: " + orgTypes.find(t => t.organisation_type_id === mergeTargetOrgType)?.organisation_type } : null}
                                onChange={(newValue) => setMergeTargetOrgType(newValue ? newValue.value : "")}
                                styles={{ control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#86efac', backgroundColor: '#f0fdf4' }) }}
                            />

                            <button
                                style={{ ...primaryBtn, backgroundColor: "#0f172a", marginTop: "10px", opacity: (mergeSourceOrgType && mergeTargetOrgType) ? 1 : 0.5 }}
                                onClick={mergeOrgType}
                                disabled={!mergeSourceOrgType || !mergeTargetOrgType}
                            >
                                Execute Merge & Cleanup
                            </button>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}

// STYLES
const container = { padding: "30px", backgroundColor: "#f8fafc", minHeight: "100%", fontFamily: "Inter, sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const title = { margin: 0, fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" };
const subtitle = { margin: "5px 0 0 0", fontSize: "14px", color: "#64748b" };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" };
const card = { backgroundColor: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" };
const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" };
const cardTitle = { margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
const label = { fontSize: "13px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" };
const input = { padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", transition: "border-color 0.2s" };
const primaryBtn = { background: "#0f172a", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" };
const secondaryBtn = { background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", padding: "12px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" };
const pillBadge = { backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "16px", fontSize: "12px", fontWeight: "700" };
const pillBadgeBlue = { backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "16px", fontSize: "12px", fontWeight: "700" };
const chip = { display: "flex", alignItems: "center", gap: "8px", border: "1px solid #cbd5e1", backgroundColor: "white", padding: "6px 12px", borderRadius: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
const chipRemoveBtn = { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s", ":hover": { color: "#ef4444" } };
