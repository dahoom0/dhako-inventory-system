import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui";
import { productApi, adjustmentsApi } from "@/utils/api";
import OrderStock from "../inventory/OrderStock";
import AddNewItem from "../inventory/AddNewItem";
import RecordDamage from "../inventory/RecordDamage";
import ProductsLibrary from "../inventory/ProductsLibrary";

type ManagerView = "menu" | "order" | "new-item" | "damage" | "products";

const InventoryManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<ManagerView>("menu");
  const [stats, setStats] = useState({ totalProducts: 0, pendingOrders: 0, damageReports: 0 });

  useEffect(() => {
    if (view !== "menu") return;

    // Fetch real stats in parallel
    Promise.all([
      // Total active products
      productApi.getProducts().then((r: any) => {
        const arr = Array.isArray(r) ? r : r?.data ?? [];
        return arr.length;
      }).catch(() => 0),

      // Damage reports this month via adjustments
      adjustmentsApi.getAdjustments({ reason: "DAMAGED" }).then((r: any) => {
        const arr = Array.isArray(r) ? r : r?.data ?? [];
        return arr.length;
      }).catch(() => 0),
    ]).then(([totalProducts, damageReports]) => {
      setStats({ totalProducts, pendingOrders: 0, damageReports });
    });
  }, [view]);

  return (
    <div className="space-y-6 p-6">
      {view === "menu" && (
        <div className="space-y-6">
          <Card className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name}</h2>
            <p className="text-gray-600 mb-8 text-lg">Inventory Management System</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <button
                onClick={() => setView("order")}
                className="p-8 rounded-xl border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 transition transform hover:scale-105"
              >
                <div className="text-6xl mb-3">📦</div>
                <div className="text-2xl font-bold text-blue-900">Dalab</div>
                <div className="text-sm text-blue-700">(Order Stock)</div>
                <div className="text-xs text-blue-600 mt-3">Request items from warehouse to branches</div>
              </button>

              <button
                onClick={() => setView("new-item")}
                className="p-8 rounded-xl border-2 border-green-300 bg-green-50 hover:bg-green-100 transition transform hover:scale-105"
              >
                <div className="text-6xl mb-3">➕</div>
                <div className="text-2xl font-bold text-green-900">Item Cusub</div>
                <div className="text-sm text-green-700">(New Item)</div>
                <div className="text-xs text-green-600 mt-3">Add new products to your catalog</div>
              </button>

              <button
                onClick={() => setView("damage")}
                className="p-8 rounded-xl border-2 border-red-300 bg-red-50 hover:bg-red-100 transition transform hover:scale-105"
              >
                <div className="text-6xl mb-3">💔</div>
                <div className="text-2xl font-bold text-red-900">Jaajab</div>
                <div className="text-sm text-red-700">(Damaged/Lost)</div>
                <div className="text-xs text-red-600 mt-3">Record damaged or lost items</div>
              </button>

              <button
                onClick={() => setView("products")}
                className="p-8 rounded-xl border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 transition transform hover:scale-105"
              >
                <div className="text-6xl mb-3">📚</div>
                <div className="text-2xl font-bold text-purple-900">Products</div>
                <div className="text-sm text-purple-700">(Products Library)</div>
                <div className="text-xs text-purple-600 mt-3">Manage all products in the system</div>
              </button>
            </div>
          </Card>

          {/* Real stats from database */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>
                Pending Orders
              </div>
              <div className="text-3xl font-bold" style={{ color: "#2563eb" }}>
                {stats.pendingOrders}
              </div>
              <div className="text-xs text-gray-500 mt-1">Waiting approval</div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>
                Total Products
              </div>
              <div className="text-3xl font-bold" style={{ color: "#16a34a" }}>
                {stats.totalProducts}
              </div>
              <div className="text-xs text-gray-500 mt-1">In your system</div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>
                Damage Reports
              </div>
              <div className="text-3xl font-bold" style={{ color: "#dc2626" }}>
                {stats.damageReports}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total recorded</div>
            </Card>
          </div>
        </div>
      )}

      {view === "order"    && <OrderStock    onBack={() => setView("menu")} />}
      {view === "new-item" && <AddNewItem    onBack={() => setView("menu")} />}
      {view === "damage"   && <RecordDamage  onBack={() => setView("menu")} />}
      {view === "products" && <ProductsLibrary onBack={() => setView("menu")} />}
    </div>
  );
};

export default InventoryManagerDashboard;
