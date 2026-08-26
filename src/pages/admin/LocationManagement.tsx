import React, { useState, FormEvent } from "react";
import { useLocations, Location } from "@/context/LocationContext";
import { PageHeader, Btn, Card } from "@/components/ui";

interface LocationWithStats extends Location {
  createdAt: string;
  stats?: {
    totalProducts: number;
    totalCtns: number;
    totalUnits: number;
    inventoryValue: number;
    recentTransactions: number;
  };
}

const LocationManagement: React.FC = () => {
  const { locations: contextLocations, updateLocation, addLocation } = useLocations();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({ name: "", type: "WAREHOUSE" as const });
  const [selectedTab, setSelectedTab] = useState<"all" | "warehouses" | "branches">("all");

  // Map context locations to include stats
  const locations: LocationWithStats[] = contextLocations.map((loc) => ({
    ...loc,
    createdAt: new Date().toISOString(),
    stats: {
      totalProducts: Math.floor(Math.random() * 15),
      totalCtns: Math.floor(Math.random() * 300),
      totalUnits: Math.floor(Math.random() * 7000),
      inventoryValue: Math.floor(Math.random() * 10000),
      recentTransactions: Math.floor(Math.random() * 150),
    },
  }));

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    try {
      if (editingLocation) {
        // Update location in context - this syncs across entire system
        updateLocation(editingLocation.id, formData.name);
      } else {
        // Create location
        const newLocation: Location = {
          id: `loc_${Date.now()}`,
          name: formData.name,
          type: formData.type as "WAREHOUSE" | "BRANCH",
        };
        addLocation(newLocation);
      }
      setFormData({ name: "", type: "WAREHOUSE" });
      setEditingLocation(null);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({ name: location.name, type: location.type });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLocation(null);
    setFormData({ name: "", type: "WAREHOUSE" });
    setFormError("");
  };

  const filteredLocations = locations.filter((loc) => {
    if (selectedTab === "warehouses") return loc.type === "WAREHOUSE";
    if (selectedTab === "branches") return loc.type === "BRANCH";
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Location Management"
        subtitle="Manage warehouses and branches. Changes sync across entire system."
        action={
          !showForm && (
            <Btn onClick={() => setShowForm(true)} variant="primary">
              + New Location
            </Btn>
          )
        }
      />

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {formError}
        </div>
      )}

      {/* Location Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingLocation ? "Edit Location" : "Create New Location"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Location name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  disabled={!!editingLocation}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="BRANCH">Branch</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary">
                {editingLocation ? "Update Location" : "Create Location"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab("all")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          All Locations ({locations.length})
        </button>
        <button
          onClick={() => setSelectedTab("warehouses")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === "warehouses"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          Warehouses ({locations.filter((l) => l.type === "WAREHOUSE").length})
        </button>
        <button
          onClick={() => setSelectedTab("branches")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === "branches"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          Branches ({locations.filter((l) => l.type === "BRANCH").length})
        </button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location) => (
          <Card key={location.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-2xl mb-2">{location.type === "WAREHOUSE" ? "🏭" : "🏪"}</div>
                <h3 className="text-lg font-semibold text-gray-800">{location.name}</h3>
                <p className="text-xs text-gray-500">{location.type}</p>
              </div>
              <button
                onClick={() => handleEdit(location)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
            </div>

            {location.stats && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Products</span>
                  <span className="font-semibold text-gray-800">{location.stats.totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stock (CTN)</span>
                  <span className="font-semibold text-gray-800">{location.stats.totalCtns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stock Value</span>
                  <span className="font-semibold text-gray-800">
                    ${location.stats.inventoryValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transactions</span>
                  <span className="font-semibold text-gray-800">
                    {location.stats.recentTransactions}
                  </span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No locations found</p>
        </Card>
      )}
    </div>
  );
};

export default LocationManagement;
