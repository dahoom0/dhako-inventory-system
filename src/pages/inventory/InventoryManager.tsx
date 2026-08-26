import React, { useState } from "react";
import { Card, Btn, PageHeader } from "@/components/ui";
import OrderStock from "./OrderStock";
import AddNewItem from "./AddNewItem";
import RecordDamage from "./RecordDamage";
import ProductsLibrary from "./ProductsLibrary";

type ManagerView = "menu" | "order" | "new-item" | "damage" | "products";

interface Props {
  branchName: string;
}

const InventoryManager: React.FC<Props> = ({ branchName }) => {
  const [view, setView] = useState<ManagerView>("menu");

  return (
    <div className="space-y-6">
      {view === "menu" && (
        <div className="space-y-6">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{branchName}</h2>
            <p className="text-gray-600 mb-8">Inventory Management</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Products Button */}
              <button
                onClick={() => setView("products")}
                className="p-6 rounded-lg border-2 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition"
              >
                <div className="text-4xl mb-2">📦</div>
                <div className="text-lg font-bold text-indigo-900">Products</div>
                <div className="text-sm text-indigo-700">(Products Library)</div>
                <div className="text-xs text-indigo-600 mt-2">Manage all products catalog</div>
              </button>

              {/* Dalab (Order) Button */}
              <button
                onClick={() => setView("order")}
                className="p-6 rounded-lg border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 transition"
              >
                <div className="text-4xl mb-2">📦</div>
                <div className="text-lg font-bold text-blue-900">Dalab</div>
                <div className="text-sm text-blue-700">(Order Stock)</div>
                <div className="text-xs text-blue-600 mt-2">Request items from warehouse</div>
              </button>

              {/* Item Cusub (New Item) Button */}
              <button
                onClick={() => setView("new-item")}
                className="p-6 rounded-lg border-2 border-green-300 bg-green-50 hover:bg-green-100 transition"
              >
                <div className="text-4xl mb-2">➕</div>
                <div className="text-lg font-bold text-green-900">Item Cusub</div>
                <div className="text-sm text-green-700">(New Item)</div>
                <div className="text-xs text-green-600 mt-2">Add new product to inventory</div>
              </button>

              {/* Jajab (Damage/Crash) Button */}
              <button
                onClick={() => setView("damage")}
                className="p-6 rounded-lg border-2 border-red-300 bg-red-50 hover:bg-red-100 transition"
              >
                <div className="text-4xl mb-2">💔</div>
                <div className="text-lg font-bold text-red-900">Jajab</div>
                <div className="text-sm text-red-700">(Damaged/Crash)</div>
                <div className="text-xs text-red-600 mt-2">Record damaged or lost items</div>
              </button>
            </div>
          </Card>
        </div>
      )}

      {view === "order" && (
        <OrderStock branchName={branchName} onBack={() => setView("menu")} />
      )}

      {view === "new-item" && (
        <AddNewItem branchName={branchName} onBack={() => setView("menu")} />
      )}

      {view === "damage" && (
        <RecordDamage branchName={branchName} onBack={() => setView("menu")} />
      )}

      {view === "products" && (
        <ProductsLibrary onBack={() => setView("menu")} />
      )}
    </div>
  );
};

export default InventoryManager;
