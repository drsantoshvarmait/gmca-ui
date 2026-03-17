import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast } from "react-hot-toast";

const MasterSelector = ({ level, entityId, masterType, onClose }) => {
    const [pool, setPool] = useState([]);
    const [selections, setSelections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [level, entityId, masterType]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch the Pool
            let sourcePool = [];
            const typeToTable = {
                'unit': { table: 'master_organisation_units', nameCol: 'unit_name' },
                'sub_unit': { table: 'master_organisation_sub_units', nameCol: 'sub_unit_name' },
                'designation': { table: 'designations', nameCol: 'designation_name' }
            };

            const config = typeToTable[masterType];
            if (!config) throw new Error("Unsupported master type");

            if (level === 'TENANT') {
                const { data } = await supabase.from(config.table).select('*').order(config.nameCol);
                sourcePool = data || [];
            } else if (level === 'ORGANISATION') {
                // For Organisation, the pool is the Parent Tenant's selections
                const { data: org } = await supabase.from('organisations').select('tenant_id').eq('organisation_id', entityId).single();
                if (org) {
                    const { data } = await supabase
                        .schema('core')
                        .from('tenant_master_selections')
                        .select('master_id')
                        .eq('tenant_id', org.tenant_id)
                        .eq('master_type', masterType);
                    
                    const selectedIds = (data || []).map(d => d.master_id);
                    if (selectedIds.length > 0) {
                        const { data: masterData } = await supabase.from(config.table).select('*').in('id', selectedIds || []).in('designation_id', selectedIds || []); 
                        // Note: Some tables use 'id', some 'designation_id'. Let's check.
                        // Actually, looking at migrations, designations uses designation_id.
                        const pk = masterType === 'designation' ? 'designation_id' : 'id';
                        const { data: correctData } = await supabase.from(config.table).select('*').in(pk, selectedIds);
                        sourcePool = correctData || [];
                    }
                }
            }
            setPool(sourcePool);

            // 2. Fetch Current Selections
            const selectionTable = level === 'TENANT' ? 'tenant_master_selections' : 'organisation_master_selections';
            const filterCol = level === 'TENANT' ? 'tenant_id' : 'organisation_id';
            const { data: current } = await supabase
                .schema('core')
                .from(selectionTable)
                .select('master_id')
                .eq(filterCol, entityId)
                .eq('master_type', masterType);
            
            setSelections((current || []).map(c => c.master_id));
        } catch (err) {
            console.error("MasterSelector Error:", err);
            toast.error("Failed to load selection pool.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = async (masterId) => {
        const selectionTable = level === 'TENANT' ? 'tenant_master_selections' : 'organisation_master_selections';
        const filterCol = level === 'TENANT' ? 'tenant_id' : 'organisation_id';
        const isCurrentlySelected = selections.includes(masterId);

        let error;
        if (isCurrentlySelected) {
            ({ error } = await supabase
                .schema('core')
                .from(selectionTable)
                .delete()
                .eq(filterCol, entityId)
                .eq('master_type', masterType)
                .eq('master_id', masterId));
        } else {
            ({ error } = await supabase
                .schema('core')
                .from(selectionTable)
                .insert({
                    [filterCol]: entityId,
                    master_type: masterType,
                    master_id: masterId
                }));
        }

        if (error) {
            toast.error("Update failed: " + error.message);
        } else {
            setSelections(prev => 
                isCurrentlySelected 
                    ? prev.filter(id => id !== masterId) 
                    : [...prev, masterId]
            );
            toast.success(isCurrentlySelected ? "Selection removed" : "Selection added");
        }
    };

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
        modal: { backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '450px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
        header: { marginBottom: '24px' },
        title: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' },
        list: { overflowY: 'auto', flex: 1, display: 'grid', gap: '8px', paddingRight: '4px' },
        item: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', transition: 'all 0.2s', cursor: 'pointer', border: '2px solid #f1f5f9' },
        itemActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
        name: { fontWeight: '600', fontSize: '14px', flex: 1, color: '#1e293b' },
        checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
        footer: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end' },
        btnSecondary: { padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer', color: '#64748b' }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Select {masterType.replace('_', ' ').toUpperCase()} Masters</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        {level === 'TENANT' ? 'Selecting from Global Pool' : 'Selecting from Tenant Pool'}
                    </p>
                </div>

                {loading ? <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div> : (
                    <div style={styles.list}>
                        {pool.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>No masters available in the source pool.</div> : pool.map(m => {
                            const id = m.id || m.designation_id;
                            const name = m.unit_name || m.sub_unit_name || m.designation_name;
                            return (
                                <div 
                                    key={id} 
                                    style={{ ...styles.item, ...(selections.includes(id) ? styles.itemActive : {}) }}
                                    onClick={() => toggleSelection(id)}
                                >
                                    <span style={styles.name}>{name}</span>
                                    <input 
                                        type="checkbox" 
                                        checked={selections.includes(id)} 
                                        readOnly
                                        style={styles.checkbox}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                <div style={styles.footer}>
                    <button style={styles.btnSecondary} onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
};

export default MasterSelector;
