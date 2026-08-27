import React, { useState, useEffect, FormEvent } from "react";
import { useAuth, CreateUserData, User, UserRole } from "@/context/AuthContext";
import { useLocations } from "@/context/LocationContext";
import { PageHeader, Btn, Card } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { exportUsersToExcel } from "@/utils/excelExport";
import { userApi } from "@/utils/api";

const UserManagement: React.FC = () => {
  const { createUser, updateUser, deleteUser, getUsers, error } = useAuth();
  const { locations } = useLocations();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    email: "",
    password: "",
    role: "BRANCH_MANAGER",
    locationId: undefined,
    locationIds: [],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    // DEBUG: Log the form data being submitted
    console.log("🔍 Form submission data:", formData);
    console.log("🔍 Available locations:", locations);

    // Validate password for new users
    if (!editingUser && formData.password && formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    // Validate locationId/locationIds requirement based on role
    if (formData.role === "BRANCH_MANAGER" && !formData.locationId) {
      setFormError("Branch assignment is required for this role");
      return;
    }
    
    if (formData.role === "INVENTORY_MANAGER" && (!formData.locationIds || formData.locationIds.length === 0)) {
      setFormError("At least one warehouse assignment is required for this role");
      return;
    }

    try {
      if (editingUser) {
        console.log("🔄 Updating user:", editingUser.id, formData);
        await updateUser(editingUser.id, formData);
      } else {
        console.log("➕ Creating new user:", formData);
        await createUser(formData);
      }
      setFormData({ name: "", email: "", password: "", role: "BRANCH_MANAGER", locationId: undefined, locationIds: [] });
      setEditingUser(null);
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      console.error("❌ Form submission error:", err);
      setFormError(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleEdit = async (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      locationId: user.locationId,
      locationIds: [],
    });

    // If INVENTORY_MANAGER, fetch their assigned locations
    if (user.role === "INVENTORY_MANAGER") {
      try {
        const locationsData = await userApi.getUserLocations(user.id);
        const locationIds = locationsData.locations.map((loc: any) => loc.id);
        setFormData(prev => ({ ...prev, locationIds }));
      } catch (err) {
        console.error("Failed to fetch user locations:", err);
      }
    }

    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

    try {
      await deleteUser(userId);
      await fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "BRANCH_MANAGER", locationId: undefined, locationIds: [] });
    setFormError("");
  };

  const handleExportUsers = () => {
    // Transform users data for export
    const exportData = users.map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role.replace(/_/g, " "),
      locationName: user.locationId ? locations.find(loc => loc.id === user.locationId)?.name || "N/A" : "All Locations",
      createdAt: new Date(user.createdAt).toLocaleDateString(),
    }));

    exportUsersToExcel(exportData);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="👥 User Management"
        subtitle="Create, edit, and manage system users with roles and permissions"
        action={
          !showForm && (
            <div className="flex gap-2">
              <PrintButton 
                label="Download Users"
                onExport={handleExportUsers}
              />
              <Btn onClick={() => setShowForm(true)} variant="primary">
                + Create New User
              </Btn>
            </div>
          )
        }
      />

      {(error || formError) && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700">
          <strong>Error:</strong> {error || formError}
        </div>
      )}

      {/* User Form */}
      {showForm && (
        <Card className="p-6 border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white">
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {editingUser ? "✏️ Edit User" : "➕ Create New User"}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {editingUser 
              ? "Update user details and change their role or password"
              : "Add a new user to the system with username, password, and role"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email / Username *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="e.g., john@dhako.com"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password {editingUser && "(leave blank to keep current)"} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder={editingUser ? "Leave blank to keep current password" : "Min 6 characters"}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!editingUser}
                  minLength={editingUser ? 0 : 6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingUser 
                    ? "Enter new password to change it, or leave blank"
                    : "Password must be at least 6 characters"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role / Permission *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                >
                  <option value="ADMIN">🔐 Admin - Full System Access</option>
                  <option value="INVENTORY_MANAGER">📦 Inventory Manager - Warehouse Management</option>
                  <option value="BRANCH_MANAGER">🏪 Branch Manager - Single Branch Only</option>
                </select>
              </div>

              {(formData.role === "BRANCH_MANAGER" || formData.role === "INVENTORY_MANAGER") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {formData.role === "BRANCH_MANAGER" 
                      ? "Assign Branch *" 
                      : "Assign Warehouses *"}
                  </label>
                  {formData.role === "INVENTORY_MANAGER" ? (
                    // Multi-select for INVENTORY_MANAGER
                    <select
                      name="locationIds"
                      multiple
                      value={formData.locationIds || []}
                      onChange={(e) => {
                        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData(prev => ({ ...prev, locationIds: selectedIds }));
                      }}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      required
                    >
                      {locations
                        .filter(loc => loc.type === "WAREHOUSE")
                        .map(loc => (
                          <option key={loc.id} value={loc.id}>
                            🏭 {loc.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    // Single select for BRANCH_MANAGER
                    <select
                      name="locationId"
                      value={formData.locationId || ""}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      required
                    >
                      <option value="">-- Select Location --</option>
                      {locations
                        .filter(loc => loc.type === "BRANCH")
                        .map(loc => (
                          <option key={loc.id} value={loc.id}>
                            🏪 {loc.name}
                          </option>
                        ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.role === "BRANCH_MANAGER" 
                      ? "This user will only see data for the selected branch"
                      : "Hold Ctrl/Cmd to select multiple warehouses. This manager can work with all selected warehouses."}
                  </p>
                </div>
              )}
            </div>

            {/* Role Guide */}
            <div className="bg-white border-2 border-gray-200 p-4 rounded-lg mt-6">
              <p className="text-sm font-bold text-gray-800 mb-3">📋 Role Permissions Guide:</p>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="text-lg flex-shrink-0">🔐</span>
                  <div>
                    <p className="font-semibold text-gray-700">Admin</p>
                    <p className="text-gray-600">Full system access - manage users, locations, products, view all reports</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg flex-shrink-0">📦</span>
                  <div>
                    <p className="font-semibold text-gray-700">Inventory Manager</p>
                    <p className="text-gray-600">Manage warehouse stock, orders (Dalab), new products, damage reports</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg flex-shrink-0">🏪</span>
                  <div>
                    <p className="font-semibold text-gray-700">Branch Manager</p>
                    <p className="text-gray-600">Record sales, expenses, view their branch inventory only</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
              <Btn type="submit" variant="primary">
                {editingUser ? "💾 Update User" : "➕ Create User"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Search Bar */}
      {!showForm && (
        <Card className="p-4">
          <input
            type="text"
            placeholder="🔍 Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Card>
      )}

      {/* Users Table */}
      {!showForm && (
        <Card>
          <div className="p-4 border-b-2 border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-gray-800">System Users</h3>
              <p className="text-sm text-gray-600">{filteredUsers.length} user(s)</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Email / Login</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Created</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        {searchTerm ? "No users found matching your search" : "No users found. Click 'Create New User' to add one."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">{user.email}</code>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-3 py-2 rounded-full text-xs font-bold inline-block"
                          style={{
                            background:
                              user.role === "ADMIN"
                                ? "#fee2e2"
                                : user.role === "INVENTORY_MANAGER"
                                ? "#dcfce7"
                                : "#dbeafe",
                            color:
                              user.role === "ADMIN"
                                ? "#991b1b"
                                : user.role === "INVENTORY_MANAGER"
                                ? "#166534"
                                : "#1e40af",
                          }}
                        >
                          {user.role === "ADMIN"
                            ? "🔐 Admin"
                            : user.role === "INVENTORY_MANAGER"
                            ? "📦 Inv. Manager"
                            : "🏪 Branch Mgr"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold rounded transition text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 font-semibold rounded transition text-sm"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;
