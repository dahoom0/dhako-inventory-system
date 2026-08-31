import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocations } from "../context/LocationContext";
import { PageHeader, Card, Btn, Th, Td } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { exportInventoryToExcel } from "@/utils/excelExport";
import { inventoryApi } from "@/utils/api";

interface InventoryItem {
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  locationType: string;
  qtyCtn: number;
  qtyUnits: number;
  costValue: number;
  minStockCtn: number;
  costPerCtn: number;
  sellPerCtn: number;
  lastUpdated: string;
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

const fmt = (n: number) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const Inventory: React.FC = () => {
  const { user, getAccessibleLocations } = useAuth();
  const { locations: contextLocations, getLocationName } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"inventory" | "movements">("inventory");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize with first location if available
    if (contextLocations.length > 0 && !selectedLocation) {
      setSelectedLocation(contextLocations[0].id);
    }
  }, [contextLocations]);

  // Reload inventory whenever selected location changes
  useEffect(() => {
    if (selectedLocation) {
      loadInventoryData();
    }
  }, [selectedLocation]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      // Fetch matrix and products in parallel
      const [matrixData, productsResp] = await Promise.all([
        inventoryApi.getInventoryMatrix(),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/products`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        }).then(r => r.json()),
      ]);

      // API wrapper returns inner data directly for matrix
      const matrix: any[] = Array.isArray(matrixData) ? matrixData : [];

      // Products: paginated response → { success, data: { data: [...] } }
      const rawProducts = productsResp?.data?.data ?? productsResp?.data ?? [];
      const productsArr: any[] = Array.isArray(rawProducts) ? rawProducts : [];
      const productsMap = new Map(productsArr.map((p: any) => [p.id, p]));

      // Filter to selected location only
      const locationInventory: InventoryItem[] = matrix
        .filter((item: any) => item.locationId === selectedLocation)
        .map((item: any) => {
          const product: any = productsMap.get(item.productId) || {};
          return {
            productId:    item.productId,
            productName:  item.productName,
            locationId:   item.locationId,
            locationName: item.locationName,
            locationType: item.locationType,
            qtyCtn:       item.qtyCtn,
            qtyUnits:     item.qtyUnits,
            costValue:    item.costValue,
            minStockCtn:  product.minStockCtn  ?? product.min_stock_ctn  ?? 0,
            costPerCtn:   product.costPerCtn   ?? product.cost_per_ctn   ?? 0,
            sellPerCtn:   product.sellPerCtn   ?? product.sell_per_ctn   ?? 0,
            lastUpdated:  new Date().toISOString().split("T")[0],
          };
        });

      setInventory(locationInventory);
      setMovements([]);
    } catch (error) {
      console.error("Error loading inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLowStockItems = () => {
    return inventory.filter((item) => item.qtyCtn < item.minStockCtn);
  };

  const handleExportInventory = () => {
    const selectedLocationData = contextLocations.find((l) => l.id === selectedLocation);
    const locationName = selectedLocationData?.name || "Unknown Location";
    
    // Transform inventory data for export
    const exportData = filteredInventory.map((item) => ({
      product: item.productName,
      sku: `SKU-${item.productId}`, // Generate SKU if not available
      category: "General", // Default category if not available
      location: locationName,
      quantity: item.qtyUnits,
      cartoons: item.qtyCtn,
      minStock: item.minStockCtn,
      costPerUnit: (item.costPerCtn / 20).toFixed(2),
      sellPrice: item.sellPerCtn.toFixed(2),
      status: item.qtyCtn < item.minStockCtn ? "Low Stock" : "In Stock",
      lastUpdated: item.lastUpdated,
    }));

    exportInventoryToExcel(exportData, locationName);
  };

  const filteredInventory = searchTerm
    ? inventory.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
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
            {inventory.reduce((sum, item) => sum + item.qtyUnits, 0)}
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
                        <div key={item.productId} className="text-sm text-red-700">
                          • {item.productName}: {item.qtyUnits} units (Min: {item.minStockCtn})
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
                      const isLowStock = item.qtyCtn < item.minStockCtn;
                      return (
                        <tr key={item.productId} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <Td>
                            <span className="font-semibold">{item.productName}</span>
                            <div className="text-xs" style={{ color: "#64748b" }}>{item.locationName}</div>
                          </Td>
                          <Td className="text-center font-bold">{item.qtyUnits}</Td>
                          <Td className="text-center">{item.qtyCtn} CTN</Td>
                          <Td className="text-center">{item.minStockCtn}</Td>
                          <Td className="text-right">${fmt(item.costPerCtn)}</Td>
                          <Td className="text-right font-semibold" style={{ color: "#16a34a" }}>
                            ${fmt(item.sellPerCtn)}
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
