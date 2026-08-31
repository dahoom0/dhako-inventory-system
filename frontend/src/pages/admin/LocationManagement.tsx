import React, { useState, FormEvent, useEffect } from "react";
import { locationApi } from "@/utils/api";
import { PageHeader, Btn, Card } from "@/components/ui";

interface Location {
  id: string;
  name: string;
  type: "WAREHOUSE" | "BRANCH";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

interface LocationWithStats extends Location {
  stats?: {
    totalProducts: number;
    totalCtns: number;
    totalUnits: number;
    inventoryValue: number;
    recentTransactions: number;
  } | null;
}

const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<LocationWithStats[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState({ name: "", type: "WAREHOUSE" as const });
  const [selectedTab, setSelectedTab] = useState<"all" | "warehouses" | "branches">("all");
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load locations from backend on mount
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await locationApi.getLocations();

      // Fetch stats for all locations in parallel
      const withStats: LocationWithStats[] = await Promise.all(
        data.map(async (loc: any) => {
          try {
            const stats = await locationApi.getLocationStats(loc.id);
            return { ...loc, stats };
          } catch {
            return { ...loc, stats: null };
          }
        })
      );

      setLocations(withStats);
      setFormError("");
    } catch (err) {
      console.error("Failed to load locations:", err);
      setFormError("Failed to load locations from server");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      if (editingLocation) {
        // Update location via API
        await locationApi.updateLocation(editingLocation.id, formData.name);
        setFormSuccess("Location updated successfully");
      } else {
        // Create location via API
        const result = await locationApi.createLocation(
          formData.name,
          formData.type as "WAREHOUSE" | "BRANCH"
        );
        console.log("Created location:", result);
        setFormSuccess("Location created successfully");
      }
      
      // Reload locations
      await loadLocations();
      setFormData({ name: "", type: "WAREHOUSE" });
      setEditingLocation(null);
      setShowForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Operation failed";
      setFormError(errorMsg);
      console.error("Error:", err);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({ name: location.name, type: location.type });
    setShowForm(true);
  };

  const handleDeactivate = async (location: Location) => {
    if (!confirm(`Are you sure you want to deactivate "${location.name}"?`)) {
      return;
    }

    try {
      setFormError("");
      setFormSuccess("");
      await locationApi.deactivateLocation(location.id);
      setFormSuccess(`Location "${location.name}" has been deactivated`);
      
      // Reload locations
      await loadLocations();
      
      // Clear success message after 3 seconds
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to deactivate location";
      setFormError(errorMsg);
      console.error("Error deactivating location:", err);
    }
  };

  const handleDelete = async (location: Location) => {
    try {
      setFormError("");
      setFormSuccess("");
      setIsDeleting(true);

      await locationApi.deleteLocation(location.id);
      setFormSuccess(`Location "${location.name}" has been permanently deleted`);
      setDeleteConfirm(null);
      
      // Reload locations
      await loadLocations();
      
      // Clear success message after 3 seconds
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err: any) {
      const errorMsg = err.message || err.data?.error || "Failed to delete location";
      setFormError(errorMsg);
      console.error("Error deleting location:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLocation(null);
    setFormData({ name: "", type: "WAREHOUSE" });
    setFormError("");
    setFormSuccess("");
  };

  const filteredLocations = locations.filter((loc) => {
    if (selectedTab === "warehouses") return loc.type === "WAREHOUSE";
    if (selectedTab === "branches") return loc.type === "BRANCH";
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Location Management" subtitle="Loading..." />
        <div className="text-center py-8">
          <p className="text-gray-600">Loading locations from server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Location Management"
        subtitle="Manage warehouses and branches. Changes persist to backend database."
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
          ❌ {formError}
        </div>
      )}

      {formSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✅ {formSuccess}
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
                <p className="text-xs text-gray-400 mt-1">ID: {location.id.slice(0, 8)}...</p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleEdit(location)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeactivate(location)}
                  className="text-amber-600 hover:text-amber-800 text-xs font-medium px-2 py-1 rounded hover:bg-amber-50"
                >
                  Deactivate
                </button>
                {deleteConfirm === location.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(location)}
                      disabled={isDeleting}
                      className="text-xs bg-red-600 text-white px-1 py-1 rounded hover:bg-red-700 disabled:opacity-50 flex-1"
                    >
                      {isDeleting ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs bg-gray-300 text-gray-700 px-1 py-1 rounded hover:bg-gray-400 flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(location.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>

            {location.stats ? (
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
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 text-center py-4">
                  📭 No inventory data yet
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          {locations.length === 0 ? (
            <div>
              <p className="text-gray-600 font-semibold mb-2">No locations yet</p>
              <p className="text-gray-500 text-sm mb-4">Create warehouses and branches to manage inventory</p>
              <Btn onClick={() => setShowForm(true)} variant="primary">
                ➕ Create First Location
              </Btn>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">No locations match the selected filter</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default LocationManagement;
