import React, { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocations } from "../context/LocationContext";
import { Card, Btn, Th, Td, PageHeader } from "@/components/ui";
import { salesApi, expensesApi, inventoryApi, productApi } from "../utils/api";

interface Sale {
  id: string;
  locationId: string;
  customerId?: string | null;
  date: string;
  items: SaleItem[];
  totalRevenue?: number;
  totalGrossProfit?: number;
  created_at?: string;
}

interface SaleItem {
  id?: string;
  productId: string;
  productName?: string;
  qtyCtn: number;
  sellPricePerCtn: number;
  lineRevenue?: number;
}

interface Expense {
  id: string;
  location_id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  location_name?: string;
}

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  location_id: string;
  location_name: string;
  qty_ctn: number;
  qty_units: number;
  min_stock_ctn?: number;
  status?: string;
}

interface Product {
  id: string;
  name: string;
  sell_price_per_ctn: number;
  qty_per_ctn: number;
}

type DashboardView = "menu" | "sales" | "expenses" | "inventory";

const EXPENSE_CATEGORIES = [
  "RENT",
  "STAFF",
  "ELECTRICITY",
  "TRANSPORT",
  "MAINTENANCE",
  "SUPPLIES",
  "FOOD",
  "OTHER",
];

const BranchManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { locations } = useLocations();

  // Get real branch name from locations context
  const branchLocation = locations.find(l => l.id === user?.locationId);
  const branchName = branchLocation?.name || "Your Branch";

  const [view, setView] = useState<DashboardView>("menu");
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sales form state
  const [saleForm, setSaleForm] = useState({
    productId: "",
    qtyCtn: "",
    sellPricePerCtn: "",
    paymentMethod: "CASH" as "CASH" | "ZAAD" | "OTHER",
    paymentNote: "",
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: "RENT",
    description: "",
    amount: "",
  });

  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [voidConfirm, setVoidConfirm] = useState<string | null>(null);
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [editSaleForm, setEditSaleForm] = useState({
    paymentMethod: "CASH" as "CASH" | "ZAAD" | "OTHER",
    paymentNote: "",
    sellPricePerCtn: "",
  });

  // Also load products and inventory for the menu stats on mount
  useEffect(() => {
    if (user?.locationId) {
      loadProducts();
      loadSales();
      loadExpenses();
      loadInventory();
    }
  }, [user?.locationId]);

  const loadProducts = async () => {
    try {
      const data = await productApi.getProducts();
      // API wrapper returns paginated: { data: [...], total, ... }
      const arr: Product[] = Array.isArray(data) ? data
        : Array.isArray((data as any)?.data) ? (data as any).data
        : [];
      // Map camelCase from backend
      const mapped = arr.map((p: any) => ({
        id: p.id,
        name: p.name,
        sell_price_per_ctn: p.sellPerCtn ?? p.sell_per_ctn ?? 0,
        qty_per_ctn: p.qtyPerCtn ?? p.qty_per_ctn ?? 1,
      }));
      setProducts(mapped);
      if (mapped.length > 0 && !saleForm.productId) {
        setSaleForm(prev => ({
          ...prev,
          productId: mapped[0].id,
          sellPricePerCtn: mapped[0].sell_price_per_ctn.toString(),
        }));
      }
    } catch (err: any) {
      console.error("Failed to load products:", err);
    }
  };

  const loadSales = async () => {
    if (!user?.locationId) return;
    try {
      setLoading(true);
      const data = await salesApi.getSales({ locationId: user.locationId });
      // API wrapper returns the inner data — could be array or { data: [...] }
      const arr: Sale[] = Array.isArray(data) ? data
        : Array.isArray((data as any)?.data) ? (data as any).data
        : [];
      setSales(arr);
    } catch (err: any) {
      console.error("Failed to load sales:", err);
      setError(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    if (!user?.locationId) return;
    try {
      setLoading(true);
      const data = await expensesApi.getExpenses({ locationId: user.locationId, limit: 100 });
      // API wrapper returns inner data — paginated or plain array
      const arr: Expense[] = Array.isArray(data) ? data
        : Array.isArray((data as any)?.data) ? (data as any).data
        : [];
      setExpenses(arr);
    } catch (err: any) {
      console.error("Failed to load expenses:", err);
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    if (!user?.locationId) return;
    try {
      setLoading(true);
      // Use inventory matrix and filter to this branch's location
      const data = await inventoryApi.getInventoryMatrix();
      const matrix: any[] = Array.isArray(data) ? data
        : Array.isArray((data as any)?.data) ? (data as any).data
        : [];

      const branchItems: InventoryItem[] = matrix
        .filter((item: any) => item.locationId === user.locationId)
        .map((item: any) => ({
          id: item.productId,
          product_id: item.productId,
          product_name: item.productName,
          location_id: item.locationId,
          location_name: item.locationName,
          qty_ctn: item.qtyCtn ?? 0,
          qty_units: item.qtyUnits ?? 0,
          min_stock_ctn: item.minStockCtn ?? 5,
          status: (item.qtyCtn ?? 0) < (item.minStockCtn ?? 5) ? "LOW" : "OK",
        }));

      setInventory(branchItems);
    } catch (err: any) {
      console.error("Failed to load inventory:", err);
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSale = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.locationId) return;

    try {
      setLoading(true);
      setError(null);

      const saleData = {
        locationId: user.locationId,
        date: new Date().toISOString().split("T")[0],
        paymentMethod: saleForm.paymentMethod,
        paymentNote: saleForm.paymentMethod === "OTHER" ? saleForm.paymentNote : undefined,
        items: [
          {
            productId: saleForm.productId,
            qtyCtn: parseInt(saleForm.qtyCtn),
            sellPricePerCtn: parseFloat(saleForm.sellPricePerCtn),
          }
        ]
      };

      await salesApi.createSale(saleData);
      
      // Reload sales data
      await loadSales();
      
      // Reset form
      setSaleForm({
        productId: products[0]?.id || "",
        qtyCtn: "",
        sellPricePerCtn: products[0]?.sell_price_per_ctn.toString() || "",
        paymentMethod: "CASH",
        paymentNote: "",
      });
      setShowSaleForm(false);
    } catch (err: any) {
      console.error("Failed to create sale:", err);
      setError(err.message || "Failed to create sale");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.locationId) return;

    try {
      setLoading(true);
      setError(null);

      const expenseData = {
        locationId: user.locationId,
        date: new Date().toISOString().split("T")[0],
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
      };

      await expensesApi.createExpense(expenseData);
      
      // Reload expenses data
      await loadExpenses();
      
      // Reset form
      setExpenseForm({ category: "RENT", description: "", amount: "" });
      setShowExpenseForm(false);
    } catch (err: any) {
      console.error("Failed to create expense:", err);
      setError(err.message || "Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

  const getTodaySalesTotal = () => {
    const today = new Date().toISOString().split("T")[0];
    return sales
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getLowStockItems = () => {
    return inventory.filter((item) => item.qty_ctn < (item.min_stock_ctn || 5));
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSaleForm({
        ...saleForm,
        productId,
        sellPricePerCtn: product.sell_price_per_ctn.toString()
      });
    }
  };

  const handleVoidSale = async (saleId: string) => {
    try {
      setLoading(true);
      setError(null);
      await salesApi.voidSale(saleId);
      setVoidConfirm(null);
      await loadSales();
      await loadInventory(); // refresh stock after void
    } catch (err: any) {
      setError(err.message || "Failed to void sale");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSale) return;
    try {
      setLoading(true);
      setError(null);
      await salesApi.updateSale(editSale.id, {
        paymentMethod: editSaleForm.paymentMethod,
        paymentNote: editSaleForm.paymentMethod === "OTHER" ? editSaleForm.paymentNote : undefined,
        items: editSaleForm.sellPricePerCtn
          ? editSale.items.map(item => ({
              productId: item.productId,
              sellPricePerCtn: parseFloat(editSaleForm.sellPricePerCtn),
            }))
          : undefined,
      });
      setEditSale(null);
      await loadSales();
    } catch (err: any) {
      setError(err.message || "Failed to update sale");
    } finally {
      setLoading(false);
    }
  };

  // Only BRANCH_MANAGER can access
  if (user?.role !== "BRANCH_MANAGER") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#dc2626", fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
            Access Denied
          </div>
          <div style={{ color: "#64748b" }}>Only branch managers can access this dashboard.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <div className="font-bold text-red-900">Error</div>
              <div className="text-sm text-red-700 mt-1">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="text-sm text-red-600 underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Menu View */}
      {view === "menu" && (
        <div className="space-y-6">
          <PageHeader
            title={branchName}
            subtitle="Branch Manager Dashboard"
          />

          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Manage Your Branch</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sales Button */}
              <button
                onClick={() => setView("sales")}
                className="p-8 rounded-lg border-2 border-green-300 bg-green-50 hover:bg-green-100 transition transform hover:scale-105"
              >
                <div className="text-6xl mb-3">💰</div>
                <div className="text-2xl font-bold text-green-900">Sales</div>
                <div className="text-sm text-green-700">(Record Selling)</div>
                <div className="text-xs text-green-600 mt-3">Record daily sales & transactions</div>
              </button>

              {/* Expenses Button */}
              <button
                onClick={() => setView("expenses")}
                className="p-8 rounded-lg border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 transition transform hover:scale-105"
              >
                <div className="text-6xl mb-3">💸</div>
                <div className="text-2xl font-bold text-orange-900">Qarashaad</div>
                <div className="text-sm text-orange-700">(Expenses)</div>
                <div className="text-xs text-orange-600 mt-3">Track rent, salary, & costs</div>
              </button>

              {/* Inventory Button */}
              <button
                onClick={() => setView("inventory")}
                className="p-8 rounded-lg border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 transition transform hover:scale-105"
              >
                <div className="text-6xl mb-3">📦</div>
                <div className="text-2xl font-bold text-blue-900">Inventory</div>
                <div className="text-sm text-blue-700">(Local Storage)</div>
                <div className="text-xs text-blue-600 mt-3">View your branch inventory</div>
              </button>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-green-50 border-l-4 border-green-500">
              <div className="text-sm text-gray-600">Today's Sales</div>
              <div className="text-3xl font-bold text-green-900 mt-1">
                ${getTodaySalesTotal().toFixed(2)}
              </div>
            </Card>

            <Card className="p-4 bg-orange-50 border-l-4 border-orange-500">
              <div className="text-sm text-gray-600">Total Expenses</div>
              <div className="text-3xl font-bold text-orange-900 mt-1">
                ${getTotalExpenses().toFixed(2)}
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600">Inventory Items</div>
              <div className="text-3xl font-bold text-blue-900 mt-1">
                {inventory.length}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Sales View */}
      {view === "sales" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Btn onClick={() => setView("menu")} variant="secondary">
              ← Back
            </Btn>
            <h2 className="text-3xl font-bold">💰 Sales (Record Selling)</h2>
          </div>

          {!showSaleForm ? (
            <Btn onClick={() => setShowSaleForm(true)} variant="primary">
              + Add Sale
            </Btn>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Record Sale</h3>
              <form onSubmit={handleAddSale} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Product</label>
                    <select
                      value={saleForm.productId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      disabled={loading}
                    >
                      {products.length === 0 ? (
                        <option value="">No products available</option>
                      ) : (
                        products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Quantity (Cartons)</label>
                    <input
                      type="number"
                      value={saleForm.qtyCtn}
                      onChange={(e) => setSaleForm({ ...saleForm, qtyCtn: e.target.value })}
                      placeholder="Number of cartons"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      min="1"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Price per Carton ($)</label>
                    <input
                      type="number"
                      value={saleForm.sellPricePerCtn}
                      onChange={(e) => setSaleForm({ ...saleForm, sellPricePerCtn: e.target.value })}
                      placeholder="Price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-2">Total</label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-bold text-lg">
                      ${(
                        parseInt(saleForm.qtyCtn || "0") * parseFloat(saleForm.sellPricePerCtn || "0")
                      ).toFixed(2)}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-2">Payment Method *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["CASH", "ZAAD", "OTHER"] as const).map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setSaleForm(f => ({ ...f, paymentMethod: method, paymentNote: method !== "OTHER" ? "" : f.paymentNote }))}
                          className="py-2 rounded-lg text-sm font-semibold border-2 transition-colors"
                          style={{
                            borderColor: saleForm.paymentMethod === method ? "#1e3a8a" : "#d1d5db",
                            background:  saleForm.paymentMethod === method ? "#1e3a8a" : "#fff",
                            color:       saleForm.paymentMethod === method ? "#fff" : "#374151",
                          }}
                        >
                          {method === "CASH" ? "💵 Cash" : method === "ZAAD" ? "📱 Zaad" : "✏️ Other"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {saleForm.paymentMethod === "OTHER" && (
                    <div className="md:col-span-2">
                      <label className="block font-semibold mb-2">How was it received? *</label>
                      <input
                        type="text"
                        value={saleForm.paymentNote}
                        onChange={e => setSaleForm(f => ({ ...f, paymentNote: e.target.value }))}
                        placeholder="e.g. Bank transfer, EVC Plus…"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Btn type="submit" variant="primary" disabled={loading}>
                    {loading ? "Recording..." : "Record Sale"}
                  </Btn>
                  <Btn type="button" variant="secondary" onClick={() => setShowSaleForm(false)} disabled={loading}>
                    Cancel
                  </Btn>
                </div>
              </form>
            </Card>
          )}

          {/* Sales History */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg">Sales History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <Th>Date</Th>
                    <Th>Products</Th>
                    <Th>Payment</Th>
                    <Th className="text-right">Revenue</Th>
                    <Th className="text-right">Profit</Th>
                    <Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><Td colSpan={6} className="text-center py-8 text-gray-500">Loading sales...</Td></tr>
                  ) : sales.length === 0 ? (
                    <tr><Td colSpan={6} className="text-center py-8 text-gray-500">No sales recorded</Td></tr>
                  ) : (
                    sales.map((sale) => {
                      const payMethod = (sale as any).payment_method || "CASH";
                      const payLabel  = payMethod === "OTHER" ? ((sale as any).payment_note || "Other") : payMethod;
                      const payColor  = payMethod === "CASH" ? "#16a34a" : payMethod === "ZAAD" ? "#2563eb" : "#7c3aed";
                      // Revenue: prefer backend-calculated, fall back to item-level sum
                      const rev    = Number((sale as any).totalRevenue    ?? 0) ||
                                     sale.items.reduce((s, i) => s + (Number((i as any).lineRevenue    ?? 0) || (i.qtyCtn * i.sellPricePerCtn)), 0);
                      const profit = Number((sale as any).totalGrossProfit ?? 0);
                      return (
                        <tr key={sale.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <Td style={{ color: "#64748b" }}>
                            {(() => {
                              // Handle both "2026-08-30" and "2026-08-30T00:00:00.000Z" formats
                              const raw = sale.date || "";
                              const d = raw.includes("T") ? raw.split("T")[0] : raw;
                              return d || "—";
                            })()}
                          </Td>
                          <Td>
                            {sale.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-semibold">{item.productName || getProductName(item.productId)}</span>
                                {" "}× {item.qtyCtn} CTN @ ${item.sellPricePerCtn.toFixed(2)}
                              </div>
                            ))}
                          </Td>
                          <Td>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${payColor}18`, color: payColor }}>
                              {payLabel}
                            </span>
                          </Td>
                          <Td className="text-right font-bold" style={{ color: "#16a34a" }}>
                            ${rev.toFixed(2)}
                          </Td>
                          <Td className="text-right font-bold" style={{ color: "#2563eb" }}>
                            ${profit.toFixed(2)}
                          </Td>
                          <Td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Edit button */}
                              <button
                                onClick={() => {
                                  setEditSale(sale);
                                  setEditSaleForm({
                                    paymentMethod: (sale as any).payment_method || "CASH",
                                    paymentNote: (sale as any).payment_note || "",
                                    sellPricePerCtn: sale.items[0]?.sellPricePerCtn.toString() || "",
                                  });
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                              >
                                ✏️ Edit
                              </button>
                              {/* Void button */}
                              {voidConfirm === sale.id ? (
                                <>
                                  <button
                                    onClick={() => handleVoidSale(sale.id)}
                                    disabled={loading}
                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setVoidConfirm(null)}
                                    className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                                  >
                                    No
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setVoidConfirm(sale.id)}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                                >
                                  🗑 Void
                                </button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Edit Sale Modal */}
          {editSale && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: "#1e3a8a" }}>Edit Sale</h2>
                <form onSubmit={handleEditSaleSubmit} className="space-y-4">

                  <div>
                    <label className="block font-semibold mb-2 text-sm text-gray-600">Sell Price per Carton ($)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={editSaleForm.sellPricePerCtn}
                      onChange={e => setEditSaleForm(f => ({ ...f, sellPricePerCtn: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Leave unchanged if no price change"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-sm text-gray-600">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["CASH", "ZAAD", "OTHER"] as const).map(method => (
                        <button key={method} type="button"
                          onClick={() => setEditSaleForm(f => ({ ...f, paymentMethod: method }))}
                          className="py-2 rounded-lg text-sm font-semibold border-2 transition-colors"
                          style={{
                            borderColor: editSaleForm.paymentMethod === method ? "#1e3a8a" : "#d1d5db",
                            background:  editSaleForm.paymentMethod === method ? "#1e3a8a" : "#fff",
                            color:       editSaleForm.paymentMethod === method ? "#fff" : "#374151",
                          }}>
                          {method === "CASH" ? "💵 Cash" : method === "ZAAD" ? "📱 Zaad" : "✏️ Other"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editSaleForm.paymentMethod === "OTHER" && (
                    <div>
                      <label className="block font-semibold mb-2 text-sm text-gray-600">How was it received?</label>
                      <input type="text" value={editSaleForm.paymentNote}
                        onChange={e => setEditSaleForm(f => ({ ...f, paymentNote: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g. Bank transfer, EVC Plus…" />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Btn type="submit" variant="primary" disabled={loading}>
                      {loading ? "Saving…" : "Save Changes"}
                    </Btn>
                    <Btn type="button" variant="secondary" onClick={() => setEditSale(null)}>
                      Cancel
                    </Btn>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expenses View */}
      {view === "expenses" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Btn onClick={() => setView("menu")} variant="secondary">
              ← Back
            </Btn>
            <h2 className="text-3xl font-bold">💸 Qarashaad (Expenses)</h2>
          </div>

          {!showExpenseForm ? (
            <Btn onClick={() => setShowExpenseForm(true)} variant="primary">
              + Add Expense
            </Btn>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Record Expense</h3>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Category</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      disabled={loading}
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Amount ($)</label>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="Amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-2">Description</label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="e.g., Monthly rent for storefront"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Btn type="submit" variant="primary" disabled={loading}>
                    {loading ? "Recording..." : "Record Expense"}
                  </Btn>
                  <Btn type="button" variant="secondary" onClick={() => setShowExpenseForm(false)} disabled={loading}>
                    Cancel
                  </Btn>
                </div>
              </form>
            </Card>
          )}

          {/* Expenses History */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg">Expense History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <Th>Category</Th>
                    <Th>Description</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <Td colSpan={4} className="text-center py-8 text-gray-500">
                        Loading expenses...
                      </Td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <Td colSpan={4} className="text-center py-8 text-gray-500">
                        No expenses recorded
                      </Td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <Td>
                          <span className="font-semibold">{expense.category.replace("_", " ")}</span>
                        </Td>
                        <Td>{expense.description}</Td>
                        <Td className="text-right font-bold" style={{ color: "#dc2626" }}>
                          ${expense.amount.toFixed(2)}
                        </Td>
                        <Td style={{ color: "#64748b" }}>{expense.date}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Inventory View */}
      {view === "inventory" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Btn onClick={() => setView("menu")} variant="secondary">
              ← Back
            </Btn>
            <h2 className="text-3xl font-bold">📦 Inventory (Local Storage)</h2>
          </div>

          <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Items in Stock</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">
              {inventory.reduce((sum, item) => sum + item.qty_units, 0)} units / {inventory.reduce((sum, item) => sum + item.qty_ctn, 0)} cartons
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Managed by Inventory Manager
            </div>
          </Card>

          {/* Low Stock Alert */}
          {getLowStockItems().length > 0 && (
            <Card className="p-4 bg-red-50 border-l-4 border-red-500">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-bold text-red-900">Low Stock Alert!</div>
                  <div className="text-sm text-red-700 mt-1">
                    {getLowStockItems().length} item(s) below minimum:
                  </div>
                  <div className="mt-2 space-y-1">
                    {getLowStockItems().map((item) => (
                      <div key={item.id} className="text-sm text-red-700">
                        • {item.product_name}: {item.qty_ctn} CTN (Min: {item.min_stock_ctn || 5})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Inventory Table */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg">Your Branch Inventory</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <Th>Product</Th>
                    <Th className="text-center">Units</Th>
                    <Th className="text-center">Cartons</Th>
                    <Th className="text-center">Min Stock</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <Td colSpan={5} className="text-center py-8 text-gray-500">
                        Loading inventory...
                      </Td>
                    </tr>
                  ) : inventory.length === 0 ? (
                    <tr>
                      <Td colSpan={5} className="text-center py-8 text-gray-500">
                        No inventory items found
                      </Td>
                    </tr>
                  ) : (
                    inventory.map((item) => {
                      const isLowStock = item.qty_ctn < (item.min_stock_ctn || 5);
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <Td>
                            <span className="font-semibold">{item.product_name}</span>
                          </Td>
                          <Td className="text-center font-bold">{item.qty_units}</Td>
                          <Td className="text-center">{item.qty_ctn} CTN</Td>
                          <Td className="text-center">{item.min_stock_ctn || 5}</Td>
                          <Td>
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold"
                              style={{
                                background: isLowStock ? "#fee2e2" : "#dcfce7",
                                color: isLowStock ? "#dc2626" : "#16a34a",
                              }}
                            >
                              {isLowStock ? "🔴 Low" : "✓ OK"}
                            </span>
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-500">
            <div className="text-sm font-semibold text-yellow-900">
              📝 Note: Your inventory is managed by the Inventory Manager. To request stock, use the Dalab (Order) feature in the main dashboard.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BranchManagerDashboard;
