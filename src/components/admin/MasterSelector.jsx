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
                'unit': { table: 'organisation_units', nameCol: 'unit_name', pk: 'unit_id' },
                'sub_unit': { table: 'organisation_unit_sub_units', nameCol: 'sub_unit_name', pk: 'id' },
                'designation': { table: 'designations', nameCol: 'designation_name', pk: 'designation_id' },
                'item': { table: 'item_masters', nameCol: 'item_name', pk: 'item_master_id' },
                'vendor': { table: 'proc_vendors', nameCol: 'name', pk: 'vendor_id' }
            };

            const config = typeToTable[masterType];
            if (!config) throw new Error("Unsupported master type");

            if (level === 'TENANT' || level === 'ORGANISATION') {
                // Fetch directly from the Global Pool (Superadmin pool)
                const { data } = await supabase.from(config.table).select('*').order(config.nameCol);
                sourcePool = data || [];
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
                            const config = {
                                'unit': { pk: 'unit_id', name: 'unit_name' },
                                'sub_unit': { pk: 'id', name: 'sub_unit_name' },
                                'designation': { pk: 'designation_id', name: 'designation_name' },
                                'item': { pk: 'item_master_id', name: 'item_name' },
                                'vendor': { pk: 'vendor_id', name: 'name' }
                            }[masterType];

                            const id = m[config.pk];
                            const name = m[config.name];
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
