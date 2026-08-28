import React, { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, Btn, Th, Td, PageHeader } from "@/components/ui";

interface Sale {
  id: string;
  product: string;
  quantity: number;
  unit: "carton" | "dozen" | "half-dozen";
  pricePerUnit: number;
  discount: number;
  total: number;
  date: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface InventoryItem {
  id: string;
  product: string;
  quantity: number;
  cartoons: number;
  minStock: number;
  status: string;
}

type DashboardView = "menu" | "sales" | "expenses" | "inventory";

const EXPENSE_CATEGORIES = [
  "Rent",
  "Staff Salary",
  "Utilities",
  "Transport",
  "Maintenance",
  "Marketing",
  "Other",
];

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "I001", product: "Coca Cola 330ml", quantity: 100, cartoons: 4, minStock: 30, status: "OK" },
  { id: "I002", product: "Mineral Water 600ml", quantity: 150, cartoons: 6, minStock: 30, status: "OK" },
  { id: "I003", product: "Cooking Oil 1L", quantity: 200, cartoons: 8, minStock: 40, status: "OK" },
];

const BranchManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<DashboardView>("menu");
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);

  // Sales form state
  const [saleForm, setSaleForm] = useState({
    product: "Coca Cola 330ml",
    quantity: "",
    unit: "carton" as "carton" | "dozen" | "half-dozen",
    pricePerUnit: "",
    discount: "0",
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: "Rent",
    description: "",
    amount: "",
  });

  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const getBranchName = () => {
    const branchNames: Record<string, string> = {
      "b1": "Branch Mogadishu",
      "b2": "Branch Hargeisa",
      "b3": "Branch Kismayo",
    };
    return branchNames[user?.locationId || ""] || "Your Branch";
  };

  const handleAddSale = (e: FormEvent) => {
    e.preventDefault();
    const newSale: Sale = {
      id: `S${Date.now()}`,
      product: saleForm.product,
      quantity: parseInt(saleForm.quantity),
      unit: saleForm.unit,
      pricePerUnit: parseFloat(saleForm.pricePerUnit),
      discount: parseFloat(saleForm.discount) || 0,
      total: parseFloat(saleForm.pricePerUnit) * parseInt(saleForm.quantity) - (parseFloat(saleForm.discount) || 0),
      date: new Date().toISOString().split("T")[0],
    };
    setSales([newSale, ...sales]);
    setSaleForm({ product: "Coca Cola 330ml", quantity: "", unit: "carton", pricePerUnit: "", discount: "0" });
    setShowSaleForm(false);
  };

  const handleAddExpense = (e: FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: `E${Date.now()}`,
      category: expenseForm.category,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      date: new Date().toISOString().split("T")[0],
    };
    setExpenses([newExpense, ...expenses]);
    setExpenseForm({ category: "Rent", description: "", amount: "" });
    setShowExpenseForm(false);
  };

  const getTodaySalesTotal = () => {
    const today = new Date().toISOString().split("T")[0];
    return sales.filter((s) => s.date === today).reduce((sum, s) => sum + s.total, 0);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getLowStockItems = () => {
    return inventory.filter((item) => item.quantity < item.minStock);
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
      {/* Menu View */}
      {view === "menu" && (
        <div className="space-y-6">
          <PageHeader
            title={getBranchName()}
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
                      value={saleForm.product}
                      onChange={(e) => setSaleForm({ ...saleForm, product: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option>Coca Cola 330ml</option>
                      <option>Mineral Water 600ml</option>
                      <option>Orange Juice 1L</option>
                      <option>Instant Noodles</option>
                      <option>Cooking Oil 1L</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Unit Type</label>
                    <select
                      value={saleForm.unit}
                      onChange={(e) => setSaleForm({ ...saleForm, unit: e.target.value as "carton" | "dozen" | "half-dozen" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="carton">Carton (Full Box)</option>
                      <option value="dozen">Dozen (12 items)</option>
                      <option value="half-dozen">Half-Dozen (6 items)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Quantity</label>
                    <input
                      type="number"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                      placeholder="How many?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Price per {saleForm.unit === "carton" ? "Carton" : saleForm.unit === "dozen" ? "Dozen" : "Half-Dozen"} ($)</label>
                    <input
                      type="number"
                      value={saleForm.pricePerUnit}
                      onChange={(e) => setSaleForm({ ...saleForm, pricePerUnit: e.target.value })}
                      placeholder="Price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Discount ($) - Optional</label>
                    <input
                      type="number"
                      value={saleForm.discount}
                      onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-2">Total</label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-bold text-lg">
                      ${(
                        parseInt(saleForm.quantity || "0") * parseFloat(saleForm.pricePerUnit || "0") -
                        (parseFloat(saleForm.discount || "0"))
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Btn type="submit" variant="primary">
                    Record Sale
                  </Btn>
                  <Btn type="button" variant="secondary" onClick={() => setShowSaleForm(false)}>
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
                    <Th>Product</Th>
                    <Th className="text-center">Qty</Th>
                    <Th>Unit</Th>
                    <Th className="text-right">Price/Unit</Th>
                    <Th className="text-right">Discount</Th>
                    <Th className="text-right">Total</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <Td colSpan={7} className="text-center py-8 text-gray-500">
                        No sales recorded
                      </Td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <Td>
                          <span className="font-semibold">{sale.product}</span>
                        </Td>
                        <Td className="text-center font-bold">{sale.quantity}</Td>
                        <Td>
                          <span className="text-sm font-semibold" style={{ color: "#2563eb" }}>
                            {sale.unit === "carton" ? "Carton" : sale.unit === "dozen" ? "Dozen" : "Half-Dozen"}
                          </span>
                        </Td>
                        <Td className="text-right">${sale.pricePerUnit.toFixed(2)}</Td>
                        <Td className="text-right">${sale.discount.toFixed(2)}</Td>
                        <Td className="text-right font-bold" style={{ color: "#16a34a" }}>
                          ${sale.total.toFixed(2)}
                        </Td>
                        <Td style={{ color: "#64748b" }}>{sale.date}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
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
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
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
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Btn type="submit" variant="primary">
                    Record Expense
                  </Btn>
                  <Btn type="button" variant="secondary" onClick={() => setShowExpenseForm(false)}>
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
                  {expenses.length === 0 ? (
                    <tr>
                      <Td colSpan={4} className="text-center py-8 text-gray-500">
                        No expenses recorded
                      </Td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <Td>
                          <span className="font-semibold">{expense.category}</span>
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
              {inventory.reduce((sum, item) => sum + item.quantity, 0)} units
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
                        • {item.product}: {item.quantity} units (Min: {item.minStock})
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
                    <Th className="text-center">Cartoons</Th>
                    <Th className="text-center">Min Stock</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const isLowStock = item.quantity < item.minStock;
                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <Td>
                          <span className="font-semibold">{item.product}</span>
                        </Td>
                        <Td className="text-center font-bold">{item.quantity}</Td>
                        <Td className="text-center">{item.cartoons} CTN</Td>
                        <Td className="text-center">{item.minStock}</Td>
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
                  })}
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
