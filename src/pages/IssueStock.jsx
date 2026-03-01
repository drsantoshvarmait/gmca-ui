import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

export default function IssueStock() {

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const [stores, setStores] = useState([])
  const [variants, setVariants] = useState([])

  const [availableQty, setAvailableQty] = useState(null)
  const [minStockLevel, setMinStockLevel] = useState(null)
  const [lastPurchaseCost, setLastPurchaseCost] = useState(null)
  const [lastTransactions, setLastTransactions] = useState([])
  const [costPreview, setCostPreview] = useState(null)

  const [formData, setFormData] = useState({
    tenant_id: "",
    organisation_id_uuid: "",
    store_unit_id: "",
    variant_id: "",
    issue_qty: "",
    txn_date: "",
    reference_id: ""
  })

  // ==============================
  // Initial Load
  // ==============================
  useEffect(() => {
    loadUserContext()
    loadStores()
    loadVariants()
  }, [])

  async function loadUserContext() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("user_org_map")
      .select("tenant_id, organisation_id_uuid")
      .eq("user_id", user.id)
      .single()

    if (data) {
      setFormData(prev => ({
        ...prev,
        tenant_id: data.tenant_id,
        organisation_id_uuid: data.organisation_id_uuid,
        txn_date: new Date().toISOString().split("T")[0],
        reference_id: crypto.randomUUID()
      }))
    }
  }

  async function loadStores() {
    const { data } = await supabase
      .from("store_units")
      .select("store_unit_id, store_name")

    setStores(data || [])
  }

  async function loadVariants() {
    const { data } = await supabase
      .from("item_variants")
      .select("variant_id, sku_code, item_id")

    setVariants(data || [])
  }

  // ==============================
  // Handle Input
  // ==============================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // ==============================
  // Fetch Stock Intelligence
  // ==============================
  useEffect(() => {
    async function fetchStockDetails() {

      if (!formData.store_unit_id || !formData.variant_id) return

      // 1️⃣ Available Stock
      const { data: stockData } = await supabase
        .from("v_stock_balance")
        .select("available_qty")
        .eq("tenant_id", formData.tenant_id)
        .eq("organisation_id_uuid", formData.organisation_id_uuid)
        .eq("store_unit_id", formData.store_unit_id)
        .eq("variant_id", formData.variant_id)
        .single()

      setAvailableQty(stockData?.available_qty || 0)

      // 2️⃣ Minimum Stock Level
      const { data: variantData } = await supabase
        .from("item_variants")
        .select("item_id")
        .eq("variant_id", formData.variant_id)
        .single()

      if (variantData?.item_id) {
        const { data: itemData } = await supabase
          .from("items")
          .select("min_stock_level")
          .eq("item_id", variantData.item_id)
          .single()

        setMinStockLevel(itemData?.min_stock_level || 0)
      }

      // 3️⃣ Last Purchase Cost
      const { data: purchaseData } = await supabase
        .from("stock_ledger")
        .select("unit_cost")
        .eq("variant_id", formData.variant_id)
        .eq("txn_type", "PURCHASE")
        .order("txn_date", { ascending: false })
        .limit(1)

      setLastPurchaseCost(purchaseData?.[0]?.unit_cost || null)

      // 4️⃣ Last 5 Transactions
      const { data: txnData } = await supabase
        .from("stock_ledger")
        .select("txn_type, quantity_in, quantity_out, txn_date")
        .eq("variant_id", formData.variant_id)
        .order("txn_date", { ascending: false })
        .limit(5)

      setLastTransactions(txnData || [])
    }

    fetchStockDetails()
  }, [formData.store_unit_id, formData.variant_id])

  // ==============================
  // FIFO Cost Preview
  // ==============================
  useEffect(() => {
    async function previewCost() {

      if (!formData.issue_qty || !formData.variant_id || !formData.store_unit_id)
        return

      let remaining = Number(formData.issue_qty)
      let totalCost = 0

      const { data: layers } = await supabase
        .from("stock_layers")
        .select("quantity_remaining, unit_cost")
        .eq("variant_id", formData.variant_id)
        .eq("store_unit_id", formData.store_unit_id)
        .gt("quantity_remaining", 0)
        .order("layer_date", { ascending: true })

      if (!layers) return

      for (const layer of layers) {
        if (remaining <= 0) break

        const consume = Math.min(layer.quantity_remaining, remaining)
        totalCost += consume * layer.unit_cost
        remaining -= consume
      }

      if (remaining === 0) {
        setCostPreview((totalCost / Number(formData.issue_qty)).toFixed(2))
      } else {
        setCostPreview(null)
      }
    }

    previewCost()
  }, [formData.issue_qty])

  // ==============================
  // Submit
  // ==============================
  const handleIssue = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setMessage("")

      if (Number(formData.issue_qty) > availableQty)
        throw new Error("Insufficient stock available")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("User not authenticated")

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-issue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            tenant_id: formData.tenant_id,
            organisation_id_uuid: formData.organisation_id_uuid,
            store_unit_id: formData.store_unit_id,
            variant_id: formData.variant_id,
            issue_qty: Number(formData.issue_qty),
            txn_date: formData.txn_date,
            reference_type: "STORE_ISSUE",
            reference_id: formData.reference_id
          })
        }
      )

      const result = await response.json()
      if (!response.ok) throw new Error(result)

      setMessage("Stock issued successfully ✅")
      setFormData(prev => ({
        ...prev,
        issue_qty: "",
        reference_id: crypto.randomUUID()
      }))

    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // UI
  // ==============================
  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Issue Stock</h2>

      <form onSubmit={handleIssue}>

        <label>Store</label>
        <select name="store_unit_id" value={formData.store_unit_id} onChange={handleChange}>
          <option value="">Select Store</option>
          {stores.map(s => (
            <option key={s.store_unit_id} value={s.store_unit_id}>
              {s.store_name}
            </option>
          ))}
        </select>

        <br /><br />

        <label>Variant (SKU)</label>
        <select name="variant_id" value={formData.variant_id} onChange={handleChange}>
          <option value="">Select Item</option>
          {variants.map(v => (
            <option key={v.variant_id} value={v.variant_id}>
              {v.sku_code}
            </option>
          ))}
        </select>

        {availableQty !== null && (
          <div style={{
            marginTop: 10,
            fontWeight: "bold",
            color: availableQty < minStockLevel ? "red" : "green"
          }}>
            Available Stock: {availableQty}
            {availableQty < minStockLevel && " ⚠ Below Minimum Level"}
          </div>
        )}

        {lastPurchaseCost && (
          <div>Last Purchase Cost: ₹ {lastPurchaseCost}</div>
        )}

        {costPreview && (
          <div>Estimated Issue Cost (FIFO Avg): ₹ {costPreview}</div>
        )}

        <br />

        <label>Quantity</label>
        <input
          type="number"
          name="issue_qty"
          value={formData.issue_qty}
          onChange={handleChange}
        />

        <br /><br />

        <button disabled={loading}>
          {loading ? "Processing..." : "Issue Stock"}
        </button>

      </form>

      {message && <p>{message}</p>}

      {lastTransactions.length > 0 && (
        <>
          <h4>Last 5 Transactions</h4>
          <ul>
            {lastTransactions.map((t, i) => (
              <li key={i}>
                {t.txn_date} | {t.txn_type} | 
                +{t.quantity_in || 0} / -{t.quantity_out || 0}
              </li>
            ))}
          </ul>
        </>
      )}

    </div>
  )
}
