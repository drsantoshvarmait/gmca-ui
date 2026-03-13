import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast, Toaster } from "react-hot-toast";
import Select from "react-select";

export default function PurchaseRequisitionForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [userContext, setUserContext] = useState(null);

    // Master Data
    const [accounts, setAccounts] = useState([]);
    const [hsnCodes, setHsnCodes] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [subObjectives, setSubObjectives] = useState([]);
    const [itemMaster, setItemMaster] = useState([]);
    const [tenantType, setTenantType] = useState("");

    const [formData, setFormData] = useState({
        pr_number: `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        requested_date: new Date().toISOString().split("T")[0],
        justification: "",
        workflow_id: ""
    });

    const [items, setItems] = useState([
        { id: crypto.randomUUID(), description: "", hsn_sac_code: "", account_id: "", subobjective_id: "", quantity: 1, unit_price: 0, gst_rate: 18 }
    ]);

    useEffect(() => {
        initForm();
    }, []);

    async function initForm() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

             // Fetch User Context (Tenant mapping)
            const { data: tenantMap } = await supabase
                .from("user_tenants")
                .select("tenant_id, tenants(tenant_type)")
                .eq("user_id", user.id)
                .limit(1)
                .single();

            setUserContext({ user_id: user.id, tenant_id: tenantMap?.tenant_id });
            setTenantType(tenantMap?.tenants?.tenant_type || "");

            // Load Master Data
            const [coaRes, hsnRes, wfRes, subRes, masterItemsRes] = await Promise.all([
                supabase.from("fin_coa").select("account_id, full_account_code, account_name, local_account_name, object_head").eq("account_type", "EXPENSE"),
                supabase.from("proc_hsn_sac_master").select("*"),
                supabase.from("sop_workflow").select("workflow_id, workflow_name").eq("status", "PUBLISHED"),
                supabase.from("object_heads_subobjective").select("*"),
                supabase.from("items").select("item_id, item_name, subobjective_id")
            ]);

            setAccounts(coaRes.data || []);
            setHsnCodes(hsnRes.data || []);
            setWorkflows(wfRes.data || []);
            setSubObjectives(subRes.data || []);
            setItemMaster(masterItemsRes.data || []);

            // Set default workflow if available
            const stdWf = wfRes.data?.find(w => w.workflow_name.includes("Purchase Order"));
            if (stdWf) setFormData(prev => ({ ...prev, workflow_id: stdWf.workflow_id }));

        } catch (e) {
            toast.error("Initialization failed: " + e.message);
        }
    }

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), description: "", hsn_sac_code: "", account_id: "", subobjective_id: "", quantity: 1, unit_price: 0, gst_rate: 18 }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const base = item.quantity * item.unit_price;
            const tax = base * (item.gst_rate / 100);
            return acc + base + tax;
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.workflow_id) return toast.error("Please select an approval workflow");

        setLoading(true);
        try {
            // 1. Insert PR Heading
            const currentTenantId = userContext.tenant_id || (accounts[0]?.tenant_id); // Fallback to avoid error
            
            if (!currentTenantId) throw new Error("No tenant association found for user.");

            const { data: prData, error: prError } = await supabase
                .from("proc_purchase_requisitions")
                .insert({
                    tenant_id: currentTenantId,
                    pr_number: formData.pr_number,
                    requested_by: userContext.user_id,
                    requested_date: formData.requested_date,
                    justification: formData.justification,
                    workflow_id: formData.workflow_id,
                    total_estimated_cost: calculateTotal(),
                    status: "PENDING_APPROVAL"
                })
                .select()
                .single();

            if (prError) throw prError;

            // 2. Insert Line Items
            const lineItems = items.map(item => ({
                pr_id: prData.pr_id,
                item_description: item.description,
                hsn_sac_code: item.hsn_sac_code,
                account_id: item.account_id,
                subobjective_id: item.subobjective_id || null,
                quantity: item.quantity,
                estimated_unit_price: item.unit_price,
                gst_rate: item.gst_rate
            }));

            const { error: itemsError } = await supabase
                .from("proc_pr_items")
                .insert(lineItems);
            if (itemsError) throw itemsError;

            toast.success("Purchase Requisition submitted for approval! ✅");
            navigate("/procurement");

        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={container}>
            <Toaster />
            <div style={header}>
                <button onClick={() => navigate("/procurement")} style={backBtn}>← Back</button>
                <h1 style={title}>New Purchase Requisition</h1>
            </div>

            <form onSubmit={handleSubmit} style={formCard}>

                {/* General Info Section */}
                <div style={section}>
                    <h3 style={sectionTitle}>1. General Information</h3>
                    <div style={inputGrid}>
                        <div style={inputGroup}>
                            <label style={label}>PR Number</label>
                            <input disabled value={formData.pr_number} style={inputDisabled} />
                        </div>
                        <div style={inputGroup}>
                            <label style={label}>Requested Date</label>
                            <input type="date" value={formData.requested_date} onChange={e => setFormData({ ...formData, requested_date: e.target.value })} style={input} />
                        </div>
                        <div style={inputGroup}>
                            <label style={label}>Approval Workflow</label>
                            <select value={formData.workflow_id} onChange={e => setFormData({ ...formData, workflow_id: e.target.value })} style={input}>
                                <option value="">Select SOP Workflow</option>
                                {workflows.map(wf => <option key={wf.workflow_id} value={wf.workflow_id}>{wf.workflow_name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ ...inputGroup, marginTop: '20px' }}>
                        <label style={label}>Justification / Purpose</label>
                        <textarea
                            rows="3"
                            placeholder="Reason for requisition (e.g. Replenishment for Pathology department)..."
                            value={formData.justification}
                            onChange={e => setFormData({ ...formData, justification: e.target.value })}
                            style={textarea}
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div style={section}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={sectionTitle}>2. Requested Items</h3>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {tenantType?.includes("Government") && (
                                <button type="button" onClick={() => navigate("/procurement/item-master")} style={secondaryAddBtn}>📦 Define New Item</button>
                            )}
                            <button type="button" onClick={addItem} style={addBtn}>+ Add Item Line</button>
                        </div>
                    </div>

                    <table style={table}>
                        <thead>
                            <tr style={tableHeader}>
                                <th style={th}>Item Selection (Master)</th>
                                <th style={th}>HSN/SAC</th>
                                <th style={th}>Description</th>
                                <th style={th}>Budget Code (Auto)</th>
                                <th style={th}>Qty</th>
                                <th style={th}>Unit Price (Est)</th>
                                <th style={th}>Total (Inc. Tax)</th>
                                <th style={{ ...th, width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item.id} style={tr}>
                                    <td style={{ ...td, minWidth: '240px' }}>
                                        <Select
                                            placeholder={tenantType?.includes("Government") ? "Search Item Master..." : "Search Detail..."}
                                            options={tenantType?.includes("Government") 
                                                ? itemMaster.map(im => ({ value: im.item_id, label: im.item_name, subobjective_id: im.subobjective_id, type: 'master' }))
                                                : subObjectives.map(so => ({
                                                    value: so.subobjective_id,
                                                    label: `${so.subobjective_name_en}${so.subobjective_name_mr ? ' / ' + so.subobjective_name_mr : ''}`,
                                                    object_head_code: String(so.object_head_code).trim(),
                                                    type: 'subobjective'
                                                }))
                                            }
                                            value={tenantType?.includes("Government")
                                                ? (itemMaster.find(im => im.item_name === item.description) ? { value: itemMaster.find(im => im.item_name === item.description).item_id, label: itemMaster.find(im => im.item_name === item.description).item_name } : null)
                                                : (item.subobjective_id ? {
                                                    value: item.subobjective_id,
                                                    label: subObjectives.find(so => so.subobjective_id === item.subobjective_id)
                                                        ? `${subObjectives.find(so => so.subobjective_id === item.subobjective_id).subobjective_name_en}${subObjectives.find(so => so.subobjective_id === item.subobjective_id).subobjective_name_mr ? ' / ' + subObjectives.find(so => so.subobjective_id === item.subobjective_id).subobjective_name_mr : ''}`
                                                        : 'Search...'
                                                } : null)
                                            }
                                            onChange={(val) => {
                                                if (val.type === 'master') {
                                                    const subObj = subObjectives.find(so => so.subobjective_id === val.subobjective_id);
                                                    const matchingAccount = subObj ? accounts.find(a => String(a.object_head).trim() === String(subObj.object_head_code).trim()) : null;
                                                    
                                                    setItems(items.map(i => i.id === item.id ? { 
                                                        ...i, 
                                                        description: val.label, 
                                                        subobjective_id: val.subobjective_id,
                                                        account_id: matchingAccount?.account_id || i.account_id
                                                    } : i));
                                                } else {
                                                    const matchingAccount = accounts.find(a => String(a.object_head).trim() === val.object_head_code);
                                                    updateItem(item.id, 'subobjective_id', val.value);
                                                    if (matchingAccount) {
                                                        updateItem(item.id, 'account_id', matchingAccount.account_id);
                                                    }
                                                }
                                            }}
                                            styles={selectStyles}
                                        />
                                    </td>
                                    <td style={td}>
                                        <select
                                            value={item.hsn_sac_code}
                                            onChange={e => updateItem(item.id, 'hsn_sac_code', e.target.value)}
                                            style={tableInput}
                                        >
                                            <option value="">Select HSN</option>
                                            {hsnCodes.map(c => <option key={c.hsn_sac_code} value={c.hsn_sac_code}>{c.hsn_sac_code}</option>)}
                                        </select>
                                    </td>
                                    <td style={td}>
                                        <input
                                            placeholder="Item Description"
                                            value={item.description}
                                            readOnly={tenantType?.includes("Government")}
                                            onChange={e => updateItem(item.id, 'description', e.target.value)}
                                            style={{ ...tableInput, backgroundColor: tenantType?.includes("Government") ? '#f9fafb' : 'white' }}
                                        />
                                    </td>
                                    <td style={{ ...td, minWidth: '180px' }}>
                                        {item.account_id ? (
                                            <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', fontFamily: 'Monaco, monospace', fontWeight: '700', color: '#4f46e5' }}>
                                                {accounts.find(a => a.account_id === item.account_id)?.full_account_code}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Select detail first...</span>
                                        )}
                                    </td>
                                    <td style={td}>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                            style={{ ...tableInput, width: '60px' }}
                                        />
                                    </td>
                                    <td style={td}>
                                        <input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                                            style={{ ...tableInput, width: '100px' }}
                                        />
                                    </td>
                                    <td style={{ ...td, fontWeight: '700', color: '#111827' }}>
                                        ₹{(item.quantity * item.unit_price * (1 + item.gst_rate / 100)).toLocaleString()}
                                    </td>
                                    <td style={td}>
                                        <button type="button" onClick={() => removeItem(item.id)} style={removeBtn}>×</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Section */}
                <div style={footer}>
                    <div style={summary}>
                        <div style={summaryLabel}>Estimated Total Appropriation</div>
                        <div style={summaryValue}>₹ {calculateTotal().toLocaleString()}</div>
                    </div>
                    <button type="submit" disabled={loading} style={submitBtn}>
                        {loading ? "Submitting..." : "Submit for Approval"}
                    </button>
                </div>

            </form>
        </div>
    );
}

// STYLES
const container = { padding: "40px", maxWidth: "1200px", margin: "auto", minHeight: "100vh" };
const header = { display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" };
const backBtn = { background: "none", border: "none", color: "#4f46e5", fontWeight: "700", cursor: "pointer", fontSize: "16px" };
const title = { fontSize: "28px", fontWeight: "800", color: "#111827", margin: 0 };
const formCard = { backgroundColor: "white", borderRadius: "24px", padding: "40px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9" };

const section = { marginBottom: "40px" };
const sectionTitle = { fontSize: "18px", fontWeight: "700", color: "#4b5563", marginBottom: "24px", paddingBottom: "12px", borderBottom: "1px solid #f3f4f6" };
const label = { fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", display: "block" };
const inputGrid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" };
const input = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none" };
const inputDisabled = { ...input, backgroundColor: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" };
const textarea = { ...input, resize: "none", fontFamily: "inherit" };
const inputGroup = { display: "flex", flexDirection: "column" };

const addBtn = { background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };
const secondaryAddBtn = { background: "white", color: "#4b5563", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" };
const table = { width: "100%", borderCollapse: "collapse" };
const tableHeader = { borderBottom: "2px solid #f1f5f9" };
const th = { textAlign: "left", padding: "12px", fontSize: "12px", color: "#6b7280", fontWeight: "700" };
const tr = { borderBottom: "1px solid #f3f4f6" };
const td = { padding: "12px", verticalAlign: "middle" };
const tableInput = { padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", width: "100%", fontSize: "13px" };
const removeBtn = { background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontWeight: "800" };

const footer = { marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "30px", borderTop: "2px solid #f1f5f9" };
const summary = { display: "flex", flexDirection: "column", gap: "4px" };
const summaryLabel = { fontSize: "12px", color: "#6b7280", fontWeight: "600" };
const summaryValue = { fontSize: "28px", color: "#111827", fontWeight: "900" };
const submitBtn = { backgroundColor: "#4f46e5", color: "white", padding: "16px 40px", borderRadius: "16px", border: "none", fontWeight: "700", cursor: "pointer", boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.4)" };

const selectStyles = {
    control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#e5e7eb', fontSize: '13px' }),
    menu: (base) => ({ ...base, zIndex: 9999 })
};
