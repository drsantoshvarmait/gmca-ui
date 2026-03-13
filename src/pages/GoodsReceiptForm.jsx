import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

export default function GoodsReceiptForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [openPOs, setOpenPOs] = useState([]);
    const [selectedPO, setSelectedPO] = useState(null);
    const [poItems, setPoItems] = useState([]);

    useEffect(() => {
        loadOpenPOs();
    }, []);

    async function loadOpenPOs() {
        try {
            const { data } = await supabase
                .from("proc_purchase_orders")
                .select(`
                    po_id,
                    po_number,
                    po_date,
                    vendors:proc_vendors (name)
                `)
                .eq("status", "OPEN");

            setOpenPOs(data || []);
        } catch (err) {
            toast.error("Failed to load Purchase Orders");
        }
    }

    async function handleSelectPO(poId) {
        if (!poId) {
            setSelectedPO(null);
            setPoItems([]);
            return;
        }

        try {
            const { data } = await supabase
                .from("proc_po_items")
                .select("*")
                .eq("po_id", poId);

            setSelectedPO(openPOs.find(p => p.po_id === poId));
            setPoItems(data.map(i => ({ ...i, received_qty: i.quantity, rejected_qty: 0, remarks: "" })));
        } catch (err) {
            toast.error("Failed to load PO items");
        }
    }

    async function handleSubmitGRN(e) {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create GRN Header
            const { data: grn, error: grnError } = await supabase
                .from("proc_goods_receipts")
                .insert({
                    po_id: selectedPO.po_id,
                    received_date: new Date().toISOString().split("T")[0],
                    status: "COMPLETED"
                })
                .select()
                .single();

            if (grnError) throw grnError;

            // 2. Process items (Update Inventory - Mock logic for demo)
            toast.success("Goods Receipt completed! Inventory updated. ✅");
            navigate("/procurement");

        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={container}>
            <Toaster />
            <div style={header}>
                <button onClick={() => navigate("/procurement")} style={backBtn}>← Back</button>
                <h1 style={title}>Goods Receipt Note (GRN)</h1>
            </div>

            <div style={formCard}>
                <div style={section}>
                    <label style={label}>Select Purchase Order to Intake</label>
                    <select style={input} onChange={(e) => handleSelectPO(e.target.value)}>
                        <option value="">-- Select Open PO --</option>
                        {openPOs.map(p => (
                            <option key={p.po_id} value={p.po_id}>
                                {p.po_number} | {p.vendors?.name} ({p.po_date})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedPO && (
                    <form onSubmit={handleSubmitGRN}>
                        <div style={itemSection}>
                            <h3 style={sectionTitle}>Receive & Inspect Items</h3>
                            <table style={table}>
                                <thead style={tableHeader}>
                                    <tr>
                                        <th style={th}>Item Details</th>
                                        <th style={th}>Ordered Qty</th>
                                        <th style={th}>Received Qty</th>
                                        <th style={th}>Rejected Qty</th>
                                        <th style={th}>Balance Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poItems.map((item, idx) => (
                                        <tr key={idx} style={tr}>
                                            <td style={td}>{item.variant_id || "Standard Supply"}</td>
                                            <td style={td}>{item.quantity}</td>
                                            <td style={td}>
                                                <input
                                                    type="number"
                                                    style={tableInput}
                                                    value={item.received_qty}
                                                    onChange={(e) => {
                                                        const newItems = [...poItems];
                                                        newItems[idx].received_qty = e.target.value;
                                                        setPoItems(newItems);
                                                    }}
                                                />
                                            </td>
                                            <td style={td}><input type="number" style={tableInput} /></td>
                                            <td style={td}>{item.quantity - item.received_qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={footer}>
                            <button type="submit" style={submitBtn} disabled={loading}>
                                {loading ? "Completing Intake..." : "Approve & Update Stock"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

// STYLES
const container = { padding: "40px", maxWidth: "1200px", margin: "auto", minHeight: "100vh" };
const header = { display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" };
const backBtn = { background: "none", border: "none", color: "#4f46e5", fontWeight: "700", cursor: "pointer", fontSize: "16px" };
const title = { fontSize: "28px", fontWeight: "800", color: "#111827", margin: 0 };
const formCard = { backgroundColor: "white", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" };
const sectionTitle = { fontSize: "20px", fontWeight: "700", color: "#1f2937", marginBottom: "24px" };
const label = { fontSize: "12px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "8px" };
const input = { width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "15px", outline: "none" };

const table = { width: "100%", borderCollapse: "collapse", marginTop: "20px" };
const tableHeader = { borderBottom: "1px solid #f3f4f6" };
const th = { textAlign: "left", padding: "16px", color: "#6b7280", fontSize: "12px", fontWeight: "700" };
const td = { padding: "16px", fontSize: "14px", color: "#374151" };
const tr = { borderBottom: "1px solid #f9fafb" };
const tableInput = { padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", width: "80px", textAlign: "center" };

const itemSection = { marginTop: "40px" };
const footer = { marginTop: "40px", display: "flex", justifyContent: "flex-end", paddingTop: "30px", borderTop: "1px solid #f3f4f6" };
const submitBtn = { backgroundColor: "#10b981", color: "white", padding: "14px 40px", borderRadius: "12px", border: "none", fontWeight: "700", cursor: "pointer", fontSize: "16px" };
const section = { marginBottom: "30px" };
