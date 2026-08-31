import React, { useState, useEffect, FormEvent } from "react";
import { useLocations } from "@/context/LocationContext";
import { productApi, api } from "@/utils/api";
import { Card, Btn, Th, Td } from "@/components/ui";

interface Props {
  onBack: () => void;
  branchName?: string;
}

const OrderStock: React.FC<Props> = ({ onBack }) => {
  const { locations } = useLocations();

  const [products, setProducts]     = useState<any[]>([]);
  const [transfers, setTransfers]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const [form, setForm] = useState({
    productId:      "",
    fromLocationId: "",
    toLocationId:   "",
    qtyCtn:         "1",
    notes:          "",
  });

  const warehouses = locations.filter(l => l.type === "WAREHOUSE");
  const allLocations = locations;

  // Load products on mount
  useEffect(() => {
    productApi.getProducts()
      .then((r: any) => {
        const arr: any[] = Array.isArray(r) ? r
          : Array.isArray(r?.data) ? r.data
          : [];
        setProducts(arr);
      })
      .catch(() => {});
  }, []);

  // Set default form locations when locations context loads
  useEffect(() => {
    if (locations.length > 0) {
      const wh = locations.find(l => l.type === "WAREHOUSE");
      const br = locations.find(l => l.type === "BRANCH");
      setForm(f => ({
        ...f,
        fromLocationId: f.fromLocationId || wh?.id || "",
        toLocationId:   f.toLocationId   || br?.id || locations[0]?.id || "",
      }));
    }
  }, [locations]);

  // Set default product when products load
  useEffect(() => {
    if (products.length > 0 && !form.productId) {
      setForm(f => ({ ...f, productId: products[0].id }));
    }
  }, [products]);

  // Load transfers
  useEffect(() => {
    loadTransfers().finally(() => setLoading(false));
  }, []);

  const loadTransfers = async () => {
    try {
      const r: any = await api.get("/transfers");
      // Paginated response: { data: { data: [...] } } or { data: [...] }
      const arr: any[] = Array.isArray(r) ? r
        : Array.isArray(r?.data) ? r.data
        : [];
      setTransfers(arr);
    } catch {
      setTransfers([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!form.productId || !form.fromLocationId || !form.toLocationId) {
      setError("Please select a product, source warehouse, and destination.");
      return;
    }
    if (Number(form.qtyCtn) <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (form.fromLocationId === form.toLocationId) {
      setError("Source and destination must be different locations.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/transfers", {
        fromLocationId: form.fromLocationId,
        toLocationId:   form.toLocationId,
        items: [{
          productId: form.productId,
          qtyCtn:    Number(form.qtyCtn),
        }],
        notes: form.notes || undefined,
      });

      setSuccess("Transfer order submitted successfully.");
      setForm(f => ({ ...f, qtyCtn: "1", notes: "" }));
      setShowForm(false);
      await loadTransfers();
    } catch (e: any) {
      setError(e?.message || "Failed to submit transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "RECEIVED":  return { background: "#dcfce7", color: "#16a34a", label: "✓ Done" };
      case "SENT":      return { background: "#dbeafe", color: "#1d4ed8", label: "Sent" };
      case "APPROVED":  return { background: "#ede9fe", color: "#7c3aed", label: "Approved" };
      case "CANCELLED": return { background: "#fee2e2", color: "#dc2626", label: "Cancelled" };
      default:          return { background: "#fef9c3", color: "#ca8a04", label: "Pending" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Btn onClick={onBack} variant="secondary">← Back</Btn>
        <h2 className="text-2xl font-bold">Dalab (Order Stock)</h2>
      </div>

      {error   && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}

      {/* New Order Button / Form */}
      {!showForm ? (
        <Btn onClick={() => setShowForm(true)} variant="primary">+ New Order (Dalab Cusub)</Btn>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Request Stock from Warehouse</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block font-semibold mb-2">Product *</label>
                <select
                  value={form.productId}
                  onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select product…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Quantity (CTN) *</label>
                <input
                  type="number" min="1" value={form.qtyCtn}
                  onChange={e => setForm(f => ({ ...f, qtyCtn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">From Warehouse *</label>
                <select
                  value={form.fromLocationId}
                  onChange={e => setForm(f => ({ ...f, fromLocationId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select warehouse…</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">To Location *</label>
                <select
                  value={form.toLocationId}
                  onChange={e => setForm(f => ({ ...f, toLocationId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select destination…</option>
                  {allLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">Notes (optional)</label>
                <input
                  type="text" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Urgent delivery needed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Sending…" : "Send Order"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Transfer history — uses the actual API response shape */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Your Orders (Daladka Ku Jira)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <Th>From</Th>
                <Th>To</Th>
                <Th className="text-center">Items</Th>
                <Th>Requested By</Th>
                <Th>Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <Td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>Loading…</Td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <Td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>No orders yet</Td>
                </tr>
              ) : (
                transfers.map((t: any) => {
                  // API returns: { id, from, to, status, itemCount, createdBy, createdDate }
                  const dateStr = t.createdDate || t.created_at || t.createdAt;
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <Td><span className="font-semibold">{t.from ?? "—"}</span></Td>
                      <Td><span className="font-semibold">{t.to ?? "—"}</span></Td>
                      <Td className="text-center">{t.itemCount ?? 1} item(s)</Td>
                      <Td style={{ color: "#64748b" }}>{t.createdBy ?? "—"}</Td>
                      <Td style={{ color: "#64748b" }}>
                        {dateStr ? new Date(dateStr).toLocaleDateString() : "—"}
                      </Td>
                      <Td>
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ background: statusStyle(t.status ?? "PENDING").background, color: statusStyle(t.status ?? "PENDING").color }}
                        >
                          {statusStyle(t.status ?? "PENDING").label}
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
    </div>
  );
};

export default OrderStock;
