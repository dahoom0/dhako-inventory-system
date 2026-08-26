import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, Btn, Th, Td } from "@/components/ui";

interface InventoryItem {
  id: string;
  product: string;
  quantity: number;
  cartoons: number;
  location: string;
  lastUpdated: string;
  minStock: number;
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

type LocationType = "warehouse" | "branch";

interface Location {
  id: string;
  name: string;
  type: LocationType;
}

const WAREHOUSES: Location[] = [
  { id: "w1", name: "Warehouse A", type: "warehouse" },
  { id: "w2", name: "Warehouse B", type: "warehouse" },
  { id: "w3", name: "Warehouse C", type: "warehouse" },
];

const BRANCHES: Location[] = [
  { id: "b1", name: "Branch Mogadishu", type: "branch" },
  { id: "b2", name: "Branch Hargeisa", type: "branch" },
  { id: "b3", name: "Branch Kismayo", type: "branch" },
];

const ALL_LOCATIONS = [...WAREHOUSES, ...BRANCHES];

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "I001", product: "Coca Cola 330ml", quantity: 500, cartoons: 21, location: "w1", lastUpdated: "2026-08-25", minStock: 100 },
  { id: "I002", product: "Mineral Water 600ml", quantity: 320, cartoons: 13, location: "w1", lastUpdated: "2026-08-24", minStock: 80 },
  { id: "I003", product: "Orange Juice 1L", quantity: 150, cartoons: 6, location: "w2", lastUpdated: "2026-08-23", minStock: 50 },
  { id: "I004", product: "Instant Noodles", quantity: 800, cartoons: 33, location: "w2", lastUpdated: "2026-08-25", minStock: 200 },
  { id: "I005", product: "Biscuits Assorted", quantity: 400, cartoons: 16, location: "w3", lastUpdated: "2026-08-22", minStock: 100 },
  { id: "I006", product: "Cooking Oil 1L", quantity: 200, cartoons: 8, location: "b1", lastUpdated: "2026-08-25", minStock: 40 },
  { id: "I007", product: "Coca Cola 330ml", quantity: 100, cartoons: 4, location: "b1", lastUpdated: "2026-08-24", minStock: 30 },
  { id: "I008", product: "Mineral Water 600ml", quantity: 150, cartoons: 6, location: "b2", lastUpdated: "2026-08-23", minStock: 30 },
];

const MOCK_MOVEMENTS: Movement[] = [
  { id: "M001", product: "Coca Cola 330ml", from: "w1", to: "b1", quantity: 100, date: "2026-08-25", status: "Received" },
  { id: "M002", product: "Mineral Water 600ml", from: "w1", to: "b2", quantity: 150, date: "2026-08-24", status: "Received" },
  { id: "M003", product: "Instant Noodles", from: "w2", to: "b1", quantity: 200, date: "2026-08-23", status: "Sent" },
  { id: "M004", product: "Cooking Oil 1L", from: "w3", to: "b1", quantity: 80, date: "2026-08-22", status: "Received" },
  { id: "M005", product: "Biscuits Assorted", from: "w3", to: "b3", quantity: 100, date: "2026-08-21", status: "Pending" },
];

interface Props {
  onBack: () => void;
}

const Alaab: React.FC<Props> = ({ onBack }) => {
  const { user, getAccessibleLocations } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>("w1");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  const getLocationName = (id: string) => {
    const location = ALL_LOCATIONS.find((l) => l.id === id);
    return location?.name || id;
  };

  const getLowStockItems = () => {
    return inventory.filter((item) => item.quantity < item.minStock);
  };

  const filteredInventory = searchTerm
    ? inventory.filter((item) => item.product.toLowerCase().includes(searchTerm.toLowerCase()))
    : inventory;

  const selectedLocationData = ALL_LOCATIONS.find((l) => l.id === selectedLocation);
  const locationIcon = selectedLocationData?.type === "warehouse" ? "🏭" : "🏪";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Btn onClick={onBack} variant="secondary">
          ← Back
        </Btn>
        <h2 className="text-3xl font-bold">Alaab (Inventory)</h2>
      </div>

      {/* Location Selector */}
      <Card className="p-4">
        <label className="block font-semibold mb-3">Choose Location (Dooro Goobta):</label>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {ALL_LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`p-3 rounded-lg font-semibold transition ${
                selectedLocation === loc.id
                  ? "bg-blue-500 text-white border-2 border-blue-600"
                  : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200"
              }`}
            >
              <div className="text-xl mb-1">{locationIcon}</div>
              <div className="text-xs">{loc.name}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Location Info */}
      <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Selected Location:</div>
            <div className="text-2xl font-bold text-blue-900">
              {locationIcon} {getLocationName(selectedLocation)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Items:</div>
            <div className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>
              {inventory.length}
            </div>
          </div>
        </div>
      </Card>

      {/* Search Bar */}
      <Card className="p-4">
        <input
          type="text"
          placeholder="🔍 Search items (Raadi alaab)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      {/* Low Stock Alert */}
      {getLowStockItems().length > 0 && (
        <Card className="p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <div className="font-bold text-red-900">Low Stock Alert!</div>
              <div className="text-sm text-red-700 mt-1">
                {getLowStockItems().length} item(s) below minimum stock level:
              </div>
              <div className="mt-2 space-y-1">
                {getLowStockItems().map((item) => (
                  <div key={item.id} className="text-sm text-red-700">
                    • {item.product}: {item.quantity} (Min: {item.minStock})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Inventory Items */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Items in {getLocationName(selectedLocation)}</h3>
          <p className="text-sm text-gray-600">
            {filteredInventory.length} of {inventory.length} items
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <Th>Product Name</Th>
                <Th className="text-center">Units</Th>
                <Th className="text-center">Cartoons</Th>
                <Th className="text-center">Min Stock</Th>
                <Th>Last Updated</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-center py-8 text-gray-500">
                    No items found
                  </Td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLowStock = item.quantity < item.minStock;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <Td>
                        <span className="font-semibold">{item.product}</span>
                      </Td>
                      <Td className="text-center font-bold">{item.quantity}</Td>
                      <Td className="text-center">{item.cartoons} CTN</Td>
                      <Td className="text-center">{item.minStock}</Td>
                      <Td style={{ color: "#64748b" }}>{item.lastUpdated}</Td>
                      <Td>
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            background: isLowStock ? "#fee2e2" : "#dcfce7",
                            color: isLowStock ? "#dc2626" : "#16a34a",
                          }}
                        >
                          {isLowStock ? "🔴 Low Stock" : "✓ OK"}
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

      {/* Movement History */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Recent Movements (Socodka Ugu Dambeeyay)</h3>
          <p className="text-sm text-gray-600">Last transfers involving this location</p>
        </div>
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
      </Card>
    </div>
  );
};

export default Alaab;
