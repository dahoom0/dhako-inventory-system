import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocations } from "../context/LocationContext";
import { PageHeader, Card, Btn, Th, Td } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { exportInventoryToExcel } from "@/utils/excelExport";

interface InventoryItem {
  id: string;
  product: string;
  quantity: number;
  cartoons: number;
  location: string;
  lastUpdated: string;
  minStock: number;
  cost: number;
  sellPrice: number;
}

interface Movement {
  id: string;
  product: string;
  from: string;
  to: string;
  quantity: number;
  date: string;
  status: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "I001", product: "Coca Cola 330ml", quantity: 500, cartoons: 21, location: "w1", lastUpdated: "2026-08-25", minStock: 100, cost: 22, sellPrice: 36 },
  { id: "I002", product: "Mineral Water 600ml", quantity: 320, cartoons: 13, location: "w1", lastUpdated: "2026-08-24", minStock: 80, cost: 12, sellPrice: 16 },
  { id: "I003", product: "Orange Juice 1L", quantity: 150, cartoons: 6, location: "w2", lastUpdated: "2026-08-23", minStock: 50, cost: 30, sellPrice: 36 },
  { id: "I004", product: "Instant Noodles", quantity: 800, cartoons: 33, location: "w2", lastUpdated: "2026-08-25", minStock: 200, cost: 28, sellPrice: 38 },
  { id: "I005", product: "Biscuits Assorted", quantity: 400, cartoons: 16, location: "w3", lastUpdated: "2026-08-22", minStock: 100, cost: 35, sellPrice: 50 },
  { id: "I006", product: "Cooking Oil 1L", quantity: 200, cartoons: 8, location: "b1", lastUpdated: "2026-08-25", minStock: 40, cost: 55, sellPrice: 80 },
  { id: "I007", product: "Coca Cola 330ml", quantity: 100, cartoons: 4, location: "b1", lastUpdated: "2026-08-24", minStock: 30, cost: 22, sellPrice: 36 },
  { id: "I008", product: "Mineral Water 600ml", quantity: 150, cartoons: 6, location: "b2", lastUpdated: "2026-08-23", minStock: 30, cost: 12, sellPrice: 16 },
  { id: "I009", product: "Instant Noodles", quantity: 120, cartoons: 5, location: "b3", lastUpdated: "2026-08-22", minStock: 40, cost: 28, sellPrice: 38 },
];

const MOCK_MOVEMENTS: Movement[] = [
  { id: "M001", product: "Coca Cola 330ml", from: "w1", to: "b1", quantity: 100, date: "2026-08-25", status: "Received" },
  { id: "M002", product: "Mineral Water 600ml", from: "w1", to: "b2", quantity: 150, date: "2026-08-24", status: "Received" },
  { id: "M003", product: "Instant Noodles", from: "w2", to: "b1", quantity: 200, date: "2026-08-23", status: "Sent" },
  { id: "M004", product: "Cooking Oil 1L", from: "w3", to: "b1", quantity: 80, date: "2026-08-22", status: "Received" },
  { id: "M005", product: "Biscuits Assorted", from: "w3", to: "b3", quantity: 100, date: "2026-08-21", status: "Pending" },
];

const Inventory: React.FC = () => {
  const { user, getAccessibleLocations } = useAuth();
  const { locations: contextLocations, getLocationName } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState<string>("w1");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"inventory" | "movements">("inventory");

  useEffect(() => {
    loadInventoryData();
  }, [selectedLocation]);

  const loadInventoryData = () => {
    // Filter inventory for selected location
    const locationInventory = MOCK_INVENTORY.filter((item) => item.location === selectedLocation);
    setInventory(locationInventory);

    // Filter movements involving this location
    const locationMovements = MOCK_MOVEMENTS.filter(
      (m) => m.from === selectedLocation || m.to === selectedLocation
    );
    setMovements(locationMovements);
  };

  const getLowStockItems = () => {
    return inventory.filter((item) => item.quantity < item.minStock);
  };

  const handleExportInventory = () => {
    const selectedLocationData = contextLocations.find((l) => l.id === selectedLocation);
    const locationName = selectedLocationData?.name || "Unknown Location";
    
    // Transform inventory data for export
    const exportData = filteredInventory.map((item) => ({
      product: item.product,
      sku: `SKU-${item.id}`, // Generate SKU if not available
      category: "General", // Default category if not available
      location: locationName,
      quantity: item.quantity,
      cartoons: item.cartoons,
      minStock: item.minStock,
      costPerUnit: (item.cost / (item.cartoons || 1)).toFixed(2),
      sellPrice: item.sellPrice.toFixed(2),
      status: item.quantity < item.minStock ? "Low Stock" : "In Stock",
      lastUpdated: item.lastUpdated,
    }));

    exportInventoryToExcel(exportData, locationName);
  };

  const filteredInventory = searchTerm
    ? inventory.filter(
        (item) =>
          item.product.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : inventory;

  const selectedLocationData = contextLocations.find((l) => l.id === selectedLocation);
  const locationIcon = selectedLocationData?.type === "WAREHOUSE" ? "🏭" : "🏪";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>Inventory</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>View and manage stock across all warehouses and branches</p>
        </div>
        <div className="no-print">
          <PrintButton 
            label="Download Inventory"
            onExport={handleExportInventory}
          />
        </div>
      </div>

      {/* Location Selector - Top Row */}
      <Card className="p-4">
        <label className="block font-semibold mb-3 text-gray-700">
          Choose Location (Dooro Goobta):
        </label>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {contextLocations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`p-3 rounded-lg font-semibold transition ${
                selectedLocation === loc.id
                  ? "bg-blue-500 text-white border-2 border-blue-600 shadow-lg"
                  : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200"
              }`}
            >
              <div className="text-xl mb-1">
                {loc.type === "WAREHOUSE" ? "🏭" : "🏪"}
              </div>
              <div className="text-xs">{loc.name}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Location Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">Current Location:</div>
          <div className="text-xl font-bold text-blue-900 mt-1">
            {locationIcon} {getLocationName(selectedLocation)}
          </div>
        </Card>

        <Card className="p-4 bg-green-50 border-l-4 border-green-500">
          <div className="text-sm text-gray-600">Total Items:</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {inventory.length}
          </div>
        </Card>

        <Card className="p-4 bg-purple-50 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600">Total Units:</div>
          <div className="text-2xl font-bold text-purple-900 mt-1">
            {inventory.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600">Low Stock Items:</div>
          <div className="text-2xl font-bold text-orange-900 mt-1">
            {getLowStockItems().length}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "inventory"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 Inventory Items
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "movements"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📦 Movements
          </button>
        </div>

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-4 p-4">
            {/* Search Bar */}
            <div>
              <input
                type="text"
                placeholder="🔍 Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Low Stock Alert */}
            {getLowStockItems().length > 0 && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <div className="font-bold text-red-900">Low Stock Alert!</div>
                    <div className="text-sm text-red-700 mt-1">
                      {getLowStockItems().length} item(s) below minimum stock:
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
              </div>
            )}

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <Th>Product Name</Th>
                    <Th className="text-center">Units</Th>
                    <Th className="text-center">Cartoons</Th>
                    <Th className="text-center">Min Stock</Th>
                    <Th className="text-right">Cost/Unit</Th>
                    <Th className="text-right">Sell/Unit</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <Td colSpan={8} className="text-center py-8 text-gray-500">
                        {searchTerm ? "No products found" : "No inventory at this location"}
                      </Td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const isLowStock = item.quantity < item.minStock;
                      const costPerUnit = item.cost / (item.cartoons || 1);
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <Td>
                            <span className="font-semibold">{item.product}</span>
                          </Td>
                          <Td className="text-center font-bold">{item.quantity}</Td>
                          <Td className="text-center">{item.cartoons} CTN</Td>
                          <Td className="text-center">{item.minStock}</Td>
                          <Td className="text-right">${costPerUnit.toFixed(2)}</Td>
                          <Td className="text-right font-semibold" style={{ color: "#16a34a" }}>
                            ${item.sellPrice.toFixed(2)}
                          </Td>
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
                          <Td style={{ color: "#64748b" }}>{item.lastUpdated}</Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Movements Tab */}
        {activeTab === "movements" && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <Th>Product</Th>
                    <Th>From</Th>
                    <Th>To</Th>
                    <Th className="text-center">Qty</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <Td colSpan={6} className="text-center py-8 text-gray-500">
                        No movements recorded
                      </Td>
                    </tr>
                  ) : (
                    movements.map((movement) => (
                      <tr key={movement.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <Td>
                          <span className="font-semibold">{movement.product}</span>
                        </Td>
                        <Td>{getLocationName(movement.from)}</Td>
                        <Td>{getLocationName(movement.to)}</Td>
                        <Td className="text-center font-bold">{movement.quantity}</Td>
                        <Td style={{ color: "#64748b" }}>{movement.date}</Td>
                        <Td>
                          <span
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              background:
                                movement.status === "Received"
                                  ? "#dcfce7"
                                  : movement.status === "Sent"
                                  ? "#ede9fe"
                                  : "#fef9c3",
                              color:
                                movement.status === "Received"
                                  ? "#16a34a"
                                  : movement.status === "Sent"
                                  ? "#7c3aed"
                                  : "#ca8a04",
                            }}
                          >
                            {movement.status}
                          </span>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Inventory;
