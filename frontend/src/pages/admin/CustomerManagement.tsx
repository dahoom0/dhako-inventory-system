import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocations } from "../../context/LocationContext";
import { Card, PageHeader, Btn, Th, Td } from "../../components/ui";
import { customerApi } from "../../utils/api";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function CustomerManagement() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    locationId: "",
  });

  // Load customers on page/filter change
  useEffect(() => {
    loadCustomers();
  }, [page, search, locationFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await customerApi.getCustomers({
        page,
        limit: pageSize,
        search: search || undefined,
        locationId: locationFilter || undefined,
      });

      const paginated = response as PaginatedResponse;
      setCustomers(paginated.data);
      setTotal(paginated.total);
      setPageSize(paginated.pageSize);
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.locationId) {
      setError("Name and location are required");
      return;
    }

    try {
      await customerApi.createCustomer({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        notes: form.notes || null,
        locationId: form.locationId,
      });

      setShowModal(false);
      setForm({ name: "", phone: "", email: "", address: "", notes: "", locationId: "" });
      loadCustomers();
    } catch (err: any) {
      setError(err.message || "Failed to create customer");
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !form.name) return;

    try {
      await customerApi.updateCustomer(editingId, {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        notes: form.notes || null,
      });

      setShowModal(false);
      setEditingId(null);
      setForm({ name: "", phone: "", email: "", address: "", notes: "", locationId: "" });
      loadCustomers();
    } catch (err: any) {
      setError(err.message || "Failed to update customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      await customerApi.deleteCustomer(id);
      loadCustomers();
    } catch (err: any) {
      setError(err.message || "Failed to delete customer");
    }
  };

  const handleEdit = (customer: Customer) => {
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
      locationId: customer.locationId,
    });
    setEditingId(customer.id);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setForm({ name: "", phone: "", email: "", address: "", notes: "", locationId: locations[0]?.id || "" });
    setEditingId(null);
    setShowModal(true);
  };

  const getLocationName = (locationId: string) => {
    return locations.find((l) => l.id === locationId)?.name || "Unknown";
  };

  // Only ADMIN can access this
  if (user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#dc2626", fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
            Access Denied
          </div>
          <div style={{ color: "#64748b" }}>Only administrators can manage customers.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Customers"
        subtitle={`${total} customers`}
        action={<Btn onClick={openCreateModal}>+ Add Customer</Btn>}
      />

      {error && (
        <Card className="p-4 mb-4" style={{ background: "#fee", borderLeft: "4px solid #dc2626" }}>
          <div style={{ color: "#991b1b", fontSize: "14px" }}>{error}</div>
        </Card>
      )}

      <Card>
        <div className="p-4 flex flex-wrap gap-3 border-b" style={{ borderColor: "#e2e8f0" }}>
          <input
            type="text"
            placeholder="Search customer…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm"
            style={{ border: "1px solid #e2e8f0", outline: "none", color: "#374151" }}
          />
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg px-3 py-2 text-sm"
            style={{ border: "1px solid #e2e8f0", color: "#374151" }}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: "#94a3b8" }}>
            Loading customers…
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "#94a3b8" }}>
            No customers found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    {["Name", "Phone", "Email", "Location", "Created", "Actions"].map((h) => (
                      <Th key={h}>{h}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <Td>
                        <span className="font-medium" style={{ color: "#1e3a8a" }}>
                          {customer.name}
                        </span>
                      </Td>
                      <Td>{customer.phone || "—"}</Td>
                      <Td>{customer.email || "—"}</Td>
                      <Td>{getLocationName(customer.locationId)}</Td>
                      <Td mono>
                        <span style={{ color: "#64748b" }}>
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: "#dbeafe", color: "#0369a1" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: "#fee", color: "#991b1b" }}
                          >
                            Delete
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 flex items-center justify-between border-t" style={{ borderColor: "#e2e8f0" }}>
              <div style={{ color: "#64748b", fontSize: "14px" }}>
                Page {page} of {Math.ceil(total / pageSize)} ({total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded text-sm disabled:opacity-50"
                  style={{ border: "1px solid #e2e8f0" }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="px-3 py-1 rounded text-sm disabled:opacity-50"
                  style={{ border: "1px solid #e2e8f0" }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-5" style={{ color: "#1e3a8a" }}>
              {editingId ? "Edit Customer" : "Add Customer"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: "1px solid #e2e8f0", color: "#374151" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: "1px solid #e2e8f0", color: "#374151" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: "1px solid #e2e8f0", color: "#374151" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: "1px solid #e2e8f0", color: "#374151" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: "1px solid #e2e8f0", color: "#374151" }}
                  rows={3}
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>
                    Location *
                  </label>
                  <select
                    value={form.locationId}
                    onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ border: "1px solid #e2e8f0", color: "#374151" }}
                  >
                    <option value="">Select location…</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Btn
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Btn>
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#1e3a8a", color: "#fff" }}
              >
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
