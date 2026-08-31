import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/context/CategoryContext";
import { productApi, locationApi, categoryApi, adjustmentsApi } from "@/utils/api";
import { PageHeader, Btn, Card, Th, Td } from "@/components/ui";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  qtyPerCtn: number;
  costPerCtn: number;
  sellPerCtn: number;
  minStockCtn: number;
  status: string;
  inventory_by_location?: { location_id: string; location_name: string; quantity_ctns: number }[];
}

interface Location {
  id: string;
  name: string;
  type: string;
}

const UNITS = ["can", "bottle", "carton", "pack", "box", "bag", "tin", "unit"];

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const readonlyCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed";

export default function ProductManagement() {
  const { user } = useAuth();
  const { categories, refreshCategories } = useCategories();

  const [products, setProducts]   = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadErr, setLoadErr]     = useState<string | null>(null);

  const [panel, setPanel] = useState<"new_product" | "add_stock" | "categories" | "edit_product" | null>(null);

  // ── New product form ──────────────────────────────────────────────────────
  const [np, setNp] = useState({
    name: "", sku: "", category: "", unit: "can",
    qtyPerCtn: "24", costPerCtn: "", sellPerCtn: "", minStockCtn: "5",
    locationId: "", qtyCtn: "",
  });
  const [npErr, setNpErr]   = useState("");
  const [npOk, setNpOk]     = useState("");
  const [npBusy, setNpBusy] = useState(false);

  // ── Add stock form ────────────────────────────────────────────────────────
  const [as, setAs] = useState({ productId: "", locationId: "", qtyCtn: "", costPerCtn: "" });
  const [asErr, setAsErr]   = useState("");
  const [asOk, setAsOk]     = useState("");
  const [asBusy, setAsBusy] = useState(false);

  // ── Edit product form ─────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [ep, setEp]         = useState({
    name: "", sku: "", category: "", unit: "can",
    qtyPerCtn: "24", costPerCtn: "", sellPerCtn: "", minStockCtn: "5",
    // editable stock fields per location
    stockLocationId: "",  // which location to adjust stock for
    newStockQty: "",      // the new target total for that location
  });
  const [epErr, setEpErr]   = useState("");
  const [epOk, setEpOk]     = useState("");
  const [epBusy, setEpBusy] = useState(false);

  // ── Category manager ──────────────────────────────────────────────────────
  const [newCatName, setNewCatName] = useState("");
  const [catBusy, setCatBusy]       = useState(false);
  const [catErr, setCatErr]         = useState("");
  const [catOk, setCatOk]           = useState("");

  // ── Table filters ─────────────────────────────────────────────────────────
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("");

  // ── Delete ────────────────────────────────────────────────────────────────
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [delBusy, setDelBusy]       = useState(false);

  const warehouses = locations.filter(l => l.type === "WAREHOUSE");
  const canManage  = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER";

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadAll = async () => {
    try {
      setLoading(true);
      setLoadErr(null);
      const [prodResp, locResp] = await Promise.all([
        productApi.getProducts(),
        locationApi.getLocations(),
      ]);
      let prods: Product[] = [];
      if (Array.isArray(prodResp)) prods = prodResp;
      else if (prodResp && Array.isArray((prodResp as any).data)) prods = (prodResp as any).data;
      setProducts(prods);
      setLocations(Array.isArray(locResp) ? locResp : []);
    } catch (e: any) {
      setLoadErr(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const totalStock = (p: Product) =>
    (p.inventory_by_location || []).reduce((s, i) => s + (i.quantity_ctns || 0), 0);

  const stockAt = (p: Product, locationId: string) =>
    (p.inventory_by_location || []).find(i => i.location_id === locationId)?.quantity_ctns ?? 0;

  const margin = (p: Product) =>
    p.sellPerCtn > 0
      ? (((p.sellPerCtn - p.costPerCtn) / p.sellPerCtn) * 100).toFixed(0) + "%"
      : "—";

  const closePanel = () => {
    setPanel(null);
    setNpErr(""); setNpOk("");
    setAsErr(""); setAsOk("");
    setEpErr(""); setEpOk("");
    setCatErr(""); setCatOk("");
    setEditId(null);
  };

  const filtered = products.filter(p =>
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.sku.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  );

  // ── Create product ────────────────────────────────────────────────────────
  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    setNpErr(""); setNpOk("");

    if (!np.name || !np.sku || !np.category || !np.unit ||
        !np.qtyPerCtn || np.costPerCtn === "" || np.sellPerCtn === "" ||
        !np.locationId || !np.qtyCtn) {
      setNpErr("All fields are required"); return;
    }
    if (Number(np.qtyCtn) <= 0) { setNpErr("Initial stock quantity must be > 0"); return; }
    if (products.find(p => p.sku.toLowerCase() === np.sku.toLowerCase())) {
      setNpErr(`SKU "${np.sku}" already exists — use Add Stock instead`); return;
    }

    setNpBusy(true);
    try {
      const created = await productApi.createProduct({
        name: np.name, sku: np.sku.toUpperCase(), category: np.category, unit: np.unit,
        qtyPerCtn: Number(np.qtyPerCtn), costPerCtn: Number(np.costPerCtn),
        sellPerCtn: Number(np.sellPerCtn), minStockCtn: Number(np.minStockCtn || 5),
      });
      const product = (created as any)?.id ? created : (created as any)?.data ?? created;
      await productApi.receiveStock({
        productId: (product as any).id, warehouseId: np.locationId,
        qtyCtn: Number(np.qtyCtn), costPerCtn: Number(np.costPerCtn),
        supplier: "Initial Stock", notes: "Initial stock for new product",
      });
      setNpOk(`✅ "${np.name}" created with ${np.qtyCtn} CTN`);
      setNp({ name:"", sku:"", category: categories[0]?.name||"", unit:"can",
              qtyPerCtn:"24", costPerCtn:"", sellPerCtn:"", minStockCtn:"5",
              locationId: warehouses[0]?.id||"", qtyCtn:"" });
      await loadAll();
      setTimeout(() => { setPanel(null); setNpOk(""); }, 1500);
    } catch (e: any) {
      setNpErr(e?.message || "Failed to create product");
    } finally {
      setNpBusy(false);
    }
  };

  // ── Add stock ─────────────────────────────────────────────────────────────
  const handleAddStock = async (e: FormEvent) => {
    e.preventDefault();
    setAsErr(""); setAsOk("");
    if (!as.productId || !as.locationId || !as.qtyCtn) {
      setAsErr("Product, location and quantity are required"); return;
    }
    if (Number(as.qtyCtn) <= 0) { setAsErr("Quantity must be > 0"); return; }

    setAsBusy(true);
    try {
      const prod = products.find(p => p.id === as.productId)!;
      await productApi.receiveStock({
        productId: as.productId, warehouseId: as.locationId,
        qtyCtn: Number(as.qtyCtn),
        costPerCtn: Number(as.costPerCtn) || prod.costPerCtn,
        supplier: "Stock replenishment", notes: "Additional stock received",
      });
      setAsOk(`✅ ${as.qtyCtn} CTN added to "${prod.name}"`);
      setAs({ productId:"", locationId:"", qtyCtn:"", costPerCtn:"" });
      await loadAll();
      setTimeout(() => { setPanel(null); setAsOk(""); }, 1500);
    } catch (e: any) {
      setAsErr(e?.message || "Failed to add stock");
    } finally {
      setAsBusy(false);
    }
  };

  // ── Open edit ─────────────────────────────────────────────────────────────
  const handleEditClick = (p: Product) => {
    const firstLocId = p.inventory_by_location?.[0]?.location_id || warehouses[0]?.id || "";
    setEditId(p.id);
    setEp({
      name: p.name, sku: p.sku, category: p.category, unit: p.unit,
      qtyPerCtn: String(p.qtyPerCtn), costPerCtn: String(p.costPerCtn),
      sellPerCtn: String(p.sellPerCtn), minStockCtn: String(p.minStockCtn),
      stockLocationId: firstLocId,
      newStockQty: String(stockAt(p, firstLocId)),
    });
    setEpErr(""); setEpOk("");
    setPanel("edit_product");
  };

  // ── Update product ────────────────────────────────────────────────────────
  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    setEpErr(""); setEpOk("");

    if (!ep.name || !ep.sku || !ep.category || !ep.unit ||
        !ep.qtyPerCtn || ep.costPerCtn === "" || ep.sellPerCtn === "") {
      setEpErr("All fields are required"); return;
    }

    setEpBusy(true);
    try {
      // 1. Update product details
      await productApi.updateProduct(editId!, {
        name: ep.name, sku: ep.sku.toUpperCase(), category: ep.category, unit: ep.unit,
        qtyPerCtn: Number(ep.qtyPerCtn), costPerCtn: Number(ep.costPerCtn),
        sellPerCtn: Number(ep.sellPerCtn), minStockCtn: Number(ep.minStockCtn || 0),
      });

      // 2. If stock field was edited, create an adjustment to reach the new target
      if (ep.stockLocationId && ep.newStockQty !== "") {
        const editProd = products.find(p => p.id === editId);
        const currentQty = editProd ? stockAt(editProd, ep.stockLocationId) : 0;
        const targetQty  = Number(ep.newStockQty);
        const diff       = targetQty - currentQty;

        if (diff !== 0) {
          if (diff > 0) {
            // Add stock via receiving
            await productApi.receiveStock({
              productId: editId!, warehouseId: ep.stockLocationId,
              qtyCtn: diff, costPerCtn: Number(ep.costPerCtn),
              supplier: "Stock correction", notes: "Manual stock adjustment via product edit",
            });
          } else {
            // Remove stock via adjustment
            await adjustmentsApi.createAdjustment({
              productId: editId!, locationId: ep.stockLocationId,
              qtyCtn: diff, // negative
              reason: "CORRECTION",
              notes: "Manual stock adjustment via product edit",
            });
          }
        }
      }

      setEpOk(`✅ "${ep.name}" updated`);
      await loadAll();
      setTimeout(() => { closePanel(); }, 1200);
    } catch (e: any) {
      setEpErr(e?.message || "Failed to update product");
    } finally {
      setEpBusy(false);
    }
  };

  // ── Add category ──────────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCatName.trim()) { setCatErr("Name cannot be empty"); return; }
    setCatBusy(true); setCatErr(""); setCatOk("");
    try {
      await categoryApi.createCategory(newCatName.trim());
      await refreshCategories();
      setCatOk(`✅ "${newCatName.trim()}" added`);
      setNewCatName("");
    } catch (e: any) {
      setCatErr(e?.message || "Failed to add category");
    } finally {
      setCatBusy(false);
    }
  };

  // ── Delete product ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDelBusy(true);
    try {
      await productApi.deleteProduct(id);
      setDelConfirm(null);
      await loadAll();
    } catch (e: any) {
      alert(e?.message || "Failed to delete product");
    } finally {
      setDelBusy(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!canManage) return (
    <div className="p-6">
      <Card className="p-8 text-center">
        <p className="text-red-600 font-bold text-lg">Access Denied</p>
        <p className="text-gray-500 mt-1">Only Admins and Inventory Managers can access this page</p>
      </Card>
    </div>
  );

  if (loading) return (
    <div className="p-6">
      <PageHeader title="Product Management" subtitle="Loading…" />
      <Card className="p-8 text-center text-gray-500">Loading products…</Card>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <PageHeader
        title="Product Management"
        subtitle="Create and manage your product catalog"
        action={panel === null ? (
          <div className="flex gap-2 flex-wrap">
            <Btn variant="secondary" onClick={loadAll}>🔄 Refresh</Btn>
            <Btn variant="secondary" onClick={() => setPanel("categories")}>Manage Categories</Btn>
            <Btn variant="secondary" onClick={() => { setPanel("add_stock"); setAs({ productId:"", locationId: warehouses[0]?.id||"", qtyCtn:"", costPerCtn:"" }); }}>
              📦 Add Stock
            </Btn>
            <Btn variant="primary" onClick={() => { setPanel("new_product"); setNp(prev => ({ ...prev, category: categories[0]?.name||"", locationId: warehouses[0]?.id||"" })); }}>
              + New Product
            </Btn>
          </div>
        ) : undefined}
      />

      {loadErr && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{loadErr}</div>}

      {/* ── NEW PRODUCT ──────────────────────────────────────────────────────── */}
      {panel === "new_product" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold" style={{ color: "#1e3a8a" }}>Create New Product</h3>
            <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>
          {npErr && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{npErr}</div>}
          {npOk  && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{npOk}</div>}

          <form onSubmit={handleCreateProduct}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-semibold mb-1">Product Name *</label>
                <input value={np.name} onChange={e => setNp({...np, name: e.target.value})}
                  className={inputCls} placeholder="e.g. Coca Cola 330ml" required />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">SKU *</label>
                <input value={np.sku} onChange={e => setNp({...np, sku: e.target.value.toUpperCase()})}
                  className={`${inputCls} font-mono`} placeholder="e.g. CC330" required />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Category *</label>
                <select value={np.category} onChange={e => setNp({...np, category: e.target.value})} className={inputCls} required>
                  <option value="">— select —</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">No categories yet — <button type="button" className="underline" onClick={() => setPanel("categories")}>add one first</button></p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Unit *</label>
                <select value={np.unit} onChange={e => setNp({...np, unit: e.target.value})} className={inputCls} required>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Qty per Carton *</label>
                <input type="number" min="1" value={np.qtyPerCtn} onChange={e => setNp({...np, qtyPerCtn: e.target.value})}
                  className={inputCls} required />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Min Stock (CTN)</label>
                <input type="number" min="0" value={np.minStockCtn} onChange={e => setNp({...np, minStockCtn: e.target.value})}
                  className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Cost per Carton ($) *</label>
                <input type="number" min="0" step="0.01" value={np.costPerCtn} onChange={e => setNp({...np, costPerCtn: e.target.value})}
                  className={inputCls} placeholder="0.00" required />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Sell Price per Carton ($) *</label>
                <input type="number" min="0" step="0.01" value={np.sellPerCtn} onChange={e => setNp({...np, sellPerCtn: e.target.value})}
                  className={inputCls} placeholder="0.00" required />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Initial Stock Location *</label>
                <select value={np.locationId} onChange={e => setNp({...np, locationId: e.target.value})} className={inputCls} required>
                  <option value="">— select warehouse —</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {warehouses.length === 0 && <p className="text-xs text-orange-600 mt-1">No warehouses yet</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Total Stock (CTN) *</label>
                <input type="number" min="1" value={np.qtyCtn} onChange={e => setNp({...np, qtyCtn: e.target.value})}
                  className={inputCls} placeholder="e.g. 100" required />
                <p className="text-xs text-gray-400 mt-1">How many cartons you have right now</p>
              </div>

            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
              <Btn type="submit" variant="primary" disabled={npBusy}>{npBusy ? "Creating…" : "✅ Create Product"}</Btn>
              <Btn type="button" variant="secondary" onClick={closePanel}>Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* ── ADD STOCK ────────────────────────────────────────────────────────── */}
      {panel === "add_stock" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold" style={{ color: "#1e3a8a" }}>Add Stock to Existing Product</h3>
            <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>
          {asErr && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{asErr}</div>}
          {asOk  && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{asOk}</div>}

          <form onSubmit={handleAddStock}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Product *</label>
                <select value={as.productId} onChange={e => setAs({...as, productId: e.target.value})} className={inputCls} required>
                  <option value="">— choose product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              {/* Current stock — read-only display field */}
              <div>
                <label className="block text-sm font-semibold mb-1">Current Stock (CTN)</label>
                <input
                  type="number"
                  readOnly
                  value={as.productId ? totalStock(products.find(p => p.id === as.productId)!) : ""}
                  className={readonlyCls}
                  placeholder="—"
                />
                <p className="text-xs text-gray-400 mt-1">Stock currently in all locations</p>
              </div>

              {/* New cartons to ADD */}
              <div>
                <label className="block text-sm font-semibold mb-1">Cartons to Add (CTN) *</label>
                <input type="number" min="1" value={as.qtyCtn} onChange={e => setAs({...as, qtyCtn: e.target.value})}
                  className={inputCls} placeholder="e.g. 50" required />
                {as.productId && as.qtyCtn && Number(as.qtyCtn) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    New total: {totalStock(products.find(p => p.id === as.productId)!) + Number(as.qtyCtn)} CTN
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Warehouse *</label>
                <select value={as.locationId} onChange={e => setAs({...as, locationId: e.target.value})} className={inputCls} required>
                  <option value="">— select warehouse —</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Cost per Carton ($)</label>
                <input type="number" min="0" step="0.01" value={as.costPerCtn} onChange={e => setAs({...as, costPerCtn: e.target.value})}
                  className={inputCls} placeholder="Leave blank to use product default" />
              </div>

            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
              <Btn type="submit" variant="primary" disabled={asBusy}>{asBusy ? "Adding…" : "📦 Add Stock"}</Btn>
              <Btn type="button" variant="secondary" onClick={closePanel}>Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* ── CATEGORIES ───────────────────────────────────────────────────────── */}
      {panel === "categories" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold" style={{ color: "#1e3a8a" }}>Manage Categories</h3>
            <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>
          {catErr && <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{catErr}</div>}
          {catOk  && <div className="mb-3 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{catOk}</div>}
          <div className="flex gap-2 mb-5">
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
              className={inputCls} placeholder="New category name…" />
            <Btn variant="primary" onClick={handleAddCategory} disabled={catBusy}>{catBusy ? "Adding…" : "Add"}</Btn>
          </div>
          {categories.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No categories yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="font-medium text-sm">{c.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{c.id.slice(0, 8)}…</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <Btn variant="secondary" onClick={closePanel}>Close</Btn>
          </div>
        </Card>
      )}

      {/* ── EDIT PRODUCT ─────────────────────────────────────────────────────── */}
      {panel === "edit_product" && (() => {
        const editProd   = products.find(p => p.id === editId);
        const currentQty = editProd && ep.stockLocationId ? stockAt(editProd, ep.stockLocationId) : 0;
        const diff       = ep.newStockQty !== "" ? Number(ep.newStockQty) - currentQty : 0;
        return (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold" style={{ color: "#1e3a8a" }}>Edit Product</h3>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            {epErr && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{epErr}</div>}
            {epOk  && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{epOk}</div>}

            <form onSubmit={handleUpdateProduct}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold mb-1">Product Name *</label>
                  <input value={ep.name} onChange={e => setEp({...ep, name: e.target.value})} className={inputCls} required />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">SKU *</label>
                  <input value={ep.sku} onChange={e => setEp({...ep, sku: e.target.value.toUpperCase()})}
                    className={`${inputCls} font-mono`} required />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Category *</label>
                  <select value={ep.category} onChange={e => setEp({...ep, category: e.target.value})} className={inputCls} required>
                    <option value="">— select —</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Unit *</label>
                  <select value={ep.unit} onChange={e => setEp({...ep, unit: e.target.value})} className={inputCls} required>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Qty per Carton *</label>
                  <input type="number" min="1" value={ep.qtyPerCtn} onChange={e => setEp({...ep, qtyPerCtn: e.target.value})} className={inputCls} required />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Min Stock (CTN)</label>
                  <input type="number" min="0" value={ep.minStockCtn} onChange={e => setEp({...ep, minStockCtn: e.target.value})} className={inputCls} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Cost per Carton ($) *</label>
                  <input type="number" min="0" step="0.01" value={ep.costPerCtn} onChange={e => setEp({...ep, costPerCtn: e.target.value})} className={inputCls} required />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Sell Price per Carton ($) *</label>
                  <input type="number" min="0" step="0.01" value={ep.sellPerCtn} onChange={e => setEp({...ep, sellPerCtn: e.target.value})} className={inputCls} required />
                </div>

                {/* ── Stock section ── */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Location for Stock Adjustment</label>
                  <select
                    value={ep.stockLocationId}
                    onChange={e => {
                      const newLocId = e.target.value;
                      const qty = editProd ? stockAt(editProd, newLocId) : 0;
                      setEp({...ep, stockLocationId: newLocId, newStockQty: String(qty)});
                    }}
                    className={inputCls}
                  >
                    <option value="">— select location —</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Total Stock (CTN)</label>
                  <input
                    type="number"
                    min="0"
                    value={ep.newStockQty}
                    onChange={e => setEp({...ep, newStockQty: e.target.value})}
                    className={inputCls}
                    placeholder="Type the actual number you have"
                  />
                  {ep.stockLocationId && ep.newStockQty !== "" && diff !== 0 && (
                    <p className="text-xs mt-1" style={{ color: diff > 0 ? "#16a34a" : "#dc2626" }}>
                      {diff > 0 ? `+${diff}` : diff} CTN will be {diff > 0 ? "added" : "removed"} on save
                    </p>
                  )}
                  {ep.stockLocationId && ep.newStockQty !== "" && diff === 0 && (
                    <p className="text-xs mt-1 text-gray-400">No stock change</p>
                  )}
                </div>

              </div>
              <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                <Btn type="submit" variant="primary" disabled={epBusy}>{epBusy ? "Saving…" : "✅ Save Changes"}</Btn>
                <Btn type="button" variant="secondary" onClick={closePanel}>Cancel</Btn>
              </div>
            </form>
          </Card>
        );
      })()}

      {/* ── FILTERS ──────────────────────────────────────────────────────────── */}
      {panel === null && (
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search by name or SKU…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* ── PRODUCTS TABLE ───────────────────────────────────────────────────── */}
      {panel === null && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th>Cost</Th>
                  <Th>Sell</Th>
                  <Th>Margin</Th>
                  <Th>Min Stock</Th>
                  <Th>Stock (CTN)</Th>
                  <Th>Locations</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <Td colSpan={10}>
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">📦</div>
                        <p className="text-gray-500 font-medium">
                          {products.length === 0 ? "No products yet" : "No products match your search"}
                        </p>
                        {products.length === 0 && (
                          <p className="text-gray-400 text-sm mt-1">Click "+ New Product" to create your first product</p>
                        )}
                      </div>
                    </Td>
                  </tr>
                ) : (
                  filtered.map(p => {
                    const tot   = totalStock(p);
                    const isOut = tot === 0;
                    const isLow = !isOut && tot < p.minStockCtn;
                    const col   = isOut ? "#dc2626" : isLow ? "#ca8a04" : "#16a34a";
                    const bg    = isOut ? "#fee2e2" : isLow ? "#fef9c3" : "#dcfce7";
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }} className="hover:bg-gray-50 transition-colors">
                        <Td>
                          <div className="font-semibold" style={{ color: "#1e3a8a" }}>{p.name}</div>
                          <div className="text-xs text-gray-400">{p.unit}</div>
                        </Td>
                        <Td mono>{p.sku}</Td>
                        <Td>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                            {p.category}
                          </span>
                        </Td>
                        <Td mono>${p.costPerCtn.toFixed(2)}</Td>
                        <Td mono><span className="font-semibold" style={{ color: "#16a34a" }}>${p.sellPerCtn.toFixed(2)}</span></Td>
                        <Td mono><span style={{ color: "#7c3aed" }}>{margin(p)}</span></Td>
                        <Td mono>{p.minStockCtn}</Td>
                        <Td>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold font-mono" style={{ color: col }}>{tot}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: bg, color: col }}>
                                {isOut ? "Out" : isLow ? "Low" : "OK"}
                              </span>
                            </div>
                            {(p.inventory_by_location || []).map(inv => (
                              <div key={inv.location_id} className="text-xs flex gap-1" style={{ color: "#64748b" }}>
                                <span>{inv.location_name}:</span>
                                <span className="font-mono font-semibold">{inv.quantity_ctns}</span>
                              </div>
                            ))}
                          </div>
                        </Td>
                        <Td>
                          <span className="text-xs" style={{ color: "#64748b" }}>
                            {(p.inventory_by_location || []).length} loc
                          </span>
                        </Td>
                        <Td>
                          {delConfirm === p.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(p.id)} disabled={delBusy}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50">
                                {delBusy ? "…" : "Confirm"}
                              </button>
                              <button onClick={() => setDelConfirm(null)}
                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEditClick(p)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">
                                ✏️ Edit
                              </button>
                              <button onClick={() => setDelConfirm(p.id)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50">
                                🗑 Delete
                              </button>
                            </div>
                          )}
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
