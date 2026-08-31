import React, { useState, useEffect, FormEvent } from "react";
import { useLocations } from "@/context/LocationContext";
import { productApi, adjustmentsApi } from "@/utils/api";
import { Card, Btn, Th, Td } from "@/components/ui";

interface Props {
  onBack: () => void;
  branchName?: string; // kept for compat, unused
}

const REASONS = [
  { value: "DAMAGED",         label: "Damaged / Broken" },
  { value: "LOST",            label: "Lost in storage" },
  { value: "WRITE_OFF",       label: "Write-off / Expired" },
  { value: "INVENTORY_COUNT", label: "Inventory count correction" },
  { value: "CORRECTION",      label: "Other correction" },
];

const RecordDamage: React.FC<Props> = ({ onBack }) => {
  const { locations } = useLocations();
  const [products, setProducts]     = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const [form, setForm] = useState({
    productId:  "",
    locationId: "",
    qtyCtn:     "1",
    reason:     "DAMAGED",
    notes:      "",
  });

  const warehouses = locations.filter(l => l.type === "WAREHOUSE");

  // Load products and existing adjustments
  useEffect(() => {
    Promise.all([
      productApi.getProducts().then((r: any) => {
        const arr = Array.isArray(r) ? r : r?.data ?? [];
        setProducts(arr);
        if (arr.length > 0) setForm(f => ({ ...f, productId: arr[0].id }));
      }),
      adjustmentsApi.getAdjustments({ reason: "DAMAGED" }).then((r: any) => {
        const arr = Array.isArray(r) ? r : r?.data ?? [];
        setAdjustments(arr);
      }),
    ])
      .catch(e => setError(e?.message || "Failed to load data"))
      .finally(() => setLoading(false));

    if (warehouses.length > 0) {
      setForm(f => ({ ...f, locationId: warehouses[0].id }));
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!form.productId || !form.locationId || Number(form.qtyCtn) <= 0) {
      setError("Product, location and quantity are required.");
      return;
    }

    setSubmitting(true);
    try {
      await adjustmentsApi.createAdjustment({
        locationId: form.locationId,
        productId:  form.productId,
        qtyCtn:     -Math.abs(Number(form.qtyCtn)), // negative = remove from stock
        reason:     form.reason,
        notes:      form.notes || undefined,
      });

      setSuccess("Damage recorded and stock adjusted.");
      setForm(f => ({ ...f, qtyCtn: "1", notes: "" }));
      setShowForm(false);

      // Reload adjustments
      adjustmentsApi.getAdjustments({ reason: "DAMAGED" }).then((r: any) => {
        setAdjustments(Array.isArray(r) ? r : r?.data ?? []);
      });
    } catch (e: any) {
      setError(e?.message || "Failed to record damage");
    } finally {
      setSubmitting(false);
    }
  };

  const getProductName = (id: string) =>
    products.find(p => p.id === id)?.name ?? id.slice(0, 8) + "…";

  const getLocationName = (id: string) =>
    locations.find(l => l.id === id)?.name ?? id.slice(0, 8) + "…";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Btn onClick={onBack} variant="secondary">← Back</Btn>
        <h2 className="text-2xl font-bold">Jaajab (Damaged / Lost Items)</h2>
      </div>

      {error   && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}

      {!showForm ? (
        <Btn onClick={() => setShowForm(true)} variant="primary">+ Report Damage (Jaajab Cusub)</Btn>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Report Damaged or Lost Items</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block font-semibold mb-2">Product *</label>
                <select value={form.productId}
                  onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select product…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Location *</label>
                <select value={form.locationId}
                  onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select location…</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Quantity (CTN) *</label>
                <input type="number" min="1" value={form.qtyCtn}
                  onChange={e => setForm(f => ({ ...f, qtyCtn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>

              <div>
                <label className="block font-semibold mb-2">Reason *</label>
                <select value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  {REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">Notes (optional)</label>
                <input type="text" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional details…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Saving…" : "Report Damage"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* History from database */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Damage Reports (Jaajabka Hadii Jira)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <Th>Product</Th>
                <Th className="text-center">CTN Removed</Th>
                <Th>Location</Th>
                <Th>Reason</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><Td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>Loading…</Td></tr>
              ) : adjustments.length === 0 ? (
                <tr><Td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>No damage reports yet</Td></tr>
              ) : (
                adjustments.map((a: any) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td><span className="font-semibold">{getProductName(a.productId)}</span></Td>
                    <Td className="text-center font-bold" style={{ color: "#dc2626" }}>
                      {Math.abs(a.qtyCtn)}
                    </Td>
                    <Td>{getLocationName(a.locationId)}</Td>
                    <Td className="text-sm">{a.reason}</Td>
                    <Td style={{ color: "#64748b" }}>
                      {new Date(a.createdAt).toLocaleDateString()}
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

export default RecordDamage;
