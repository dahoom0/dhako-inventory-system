import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { salesApi, productApi, locationApi } from "../utils/api";
import { Card, PageHeader, Btn, Th, Td } from "../components/ui";

const fmt = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const today = new Date().toISOString().split("T")[0];

export default function Sales() {
  const { user } = useAuth();

  // ── All hooks MUST come before any conditional return ──────────────────
  const [sales, setSales]         = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr]     = useState("");
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState({
    locationId: "", productId: "", qtyCtn: 1,
    sellPricePerCtn: 0, customerId: "", date: today,
    paymentMethod: "CASH" as "CASH" | "ZAAD" | "OTHER",
    paymentNote: "",
  });

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    Promise.all([
      salesApi.getSales().then(r => {
        const rows = Array.isArray(r) ? r : (r as any)?.data ?? [];
        setSales(rows);
      }),
      productApi.getProducts().then(r => {
        const rows = Array.isArray(r) ? r : (r as any)?.data ?? [];
        setProducts(rows);
      }),
      locationApi.getLocations().then(r => {
        const rows = Array.isArray(r) ? r : r ?? [];
        setLocations(rows);
      }),
    ])
      .catch(e => setError(e?.message || "Failed to load data"))
      .finally(() => setLoading(false));
  }, [user?.role]);

  // ── Access guard (after all hooks) ────────────────────────────────────
  if (user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="text-lg font-bold text-red-600 mb-2">Access Denied</div>
          <div className="text-gray-500">Only administrators can view sales records.</div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center text-gray-500">Loading sales…</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center text-red-600">Error: {error}</Card>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const totalRev = sales.reduce((s, x) => {
    const items: any[] = x.items || [];
    return s + items.reduce((a: number, i: any) => a + Number(i.lineRevenue ?? 0), 0);
  }, 0);

  const totalProfit = sales.reduce((s, x) => {
    const items: any[] = x.items || [];
    return s + items.reduce((a: number, i: any) => a + Number(i.lineGrossProfit ?? 0), 0);
  }, 0);

  const filtered = sales.filter(s => {
    const name = products.find(p => {
      const items: any[] = s.items || [];
      return items.some((i: any) => i.productId === p.id);
    })?.name ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // ── Record sale ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    setFormErr("");
    if (!form.locationId || !form.productId || form.qtyCtn < 1 || form.sellPricePerCtn <= 0) {
      setFormErr("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await salesApi.createSale({
        locationId: form.locationId,
        customerId: form.customerId || null,
        date: form.date,
        paymentMethod: form.paymentMethod,
        paymentNote: form.paymentMethod === "OTHER" ? form.paymentNote : undefined,
        items: [{ productId: form.productId, qtyCtn: form.qtyCtn, sellPricePerCtn: form.sellPricePerCtn }],
      });
      // Reload sales
      const r = await salesApi.getSales();
      setSales(Array.isArray(r) ? r : (r as any)?.data ?? []);
      setShowModal(false);
      setForm({ locationId: "", productId: "", qtyCtn: 1, sellPricePerCtn: 0, customerId: "", date: today, paymentMethod: "CASH", paymentNote: "" });
    } catch (e: any) {
      setFormErr(e?.message || "Failed to record sale");
    } finally {
      setSubmitting(false);
    }
  }

  const selProd = products.find(p => p.id === form.productId);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Sales"
        subtitle={`${sales.length} transactions · ${fmt(totalRev)} revenue`}
        action={<Btn onClick={() => setShowModal(true)}>+ Record Sale</Btn>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue",  value: fmt(totalRev),    color: "#1e3a8a" },
          { label: "Gross Profit",   value: fmt(totalProfit), color: "#16a34a" },
          { label: "Avg Margin",     value: totalRev > 0 ? `${((totalProfit / totalRev) * 100).toFixed(1)}%` : "—", color: "#2563eb" },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>{c.label}</div>
            <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="p-4 border-b" style={{ borderColor: "#e2e8f0" }}>
          <input
            type="text" placeholder="Search by product…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ border: "1px solid #e2e8f0", outline: "none", color: "#374151" }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Date", "Location", "Payment", "Items", "Revenue", "Profit"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><Td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>No sales recorded yet</Td></tr>
              ) : (
                filtered.map(s => {
                  const items: any[] = s.items || [];
                  const rev    = Number(s.totalRevenue    ?? 0) || items.reduce((a: number, i: any) => a + Number(i.lineRevenue    ?? 0), 0);
                  const profit = Number(s.totalGrossProfit ?? 0) || items.reduce((a: number, i: any) => a + Number(i.lineGrossProfit ?? 0), 0);
                  const payMethod = s.payment_method || "CASH";
                  const payLabel  = payMethod === "OTHER" ? (s.payment_note || "Other") : payMethod;
                  const payColor  = payMethod === "CASH" ? "#16a34a" : payMethod === "ZAAD" ? "#2563eb" : "#7c3aed";
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <Td mono style={{ color: "#64748b" }}>{s.date}</Td>
                      <Td>{s.location_name}</Td>
                      <Td>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${payColor}18`, color: payColor }}>
                          {payLabel}
                        </span>
                      </Td>
                      <Td>
                        {items.map((i: any, idx: number) => {
                          const p = products.find(x => x.id === i.productId);
                          return (
                            <div key={idx} className="text-xs">
                              {p?.name ?? i.productId} × {i.qtyCtn} CTN @ {fmt(i.sellPricePerCtn)}
                            </div>
                          );
                        })}
                      </Td>
                      <Td mono><span className="font-semibold">{fmt(rev)}</span></Td>
                      <Td mono><span className="font-semibold" style={{ color: "#16a34a" }}>{fmt(profit)}</span></Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-5" style={{ color: "#1e3a8a" }}>Record Sale</h2>

            {formErr && <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formErr}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Location *</label>
                <select value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
                  <option value="">Select location…</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Product *</label>
                <select value={form.productId} onChange={e => {
                  const p = products.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, productId: e.target.value, sellPricePerCtn: p?.sellPerCtn ?? p?.sell_per_ctn ?? 0 }));
                }}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Cartons *</label>
                  <input type="number" min={1} value={form.qtyCtn}
                    onChange={e => setForm(f => ({ ...f, qtyCtn: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Sell Price/CTN *</label>
                  <input type="number" min={0} step="0.01" value={form.sellPricePerCtn}
                    onChange={e => setForm(f => ({ ...f, sellPricePerCtn: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Date *</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Customer ID</label>
                  <input type="text" placeholder="optional UUID" value={form.customerId}
                    onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CASH", "ZAAD", "OTHER"] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, paymentMethod: method, paymentNote: method !== "OTHER" ? "" : f.paymentNote }))}
                      className="py-2 rounded-lg text-sm font-semibold border-2 transition-colors"
                      style={{
                        borderColor: form.paymentMethod === method ? "#1e3a8a" : "#e2e8f0",
                        background:  form.paymentMethod === method ? "#1e3a8a" : "#fff",
                        color:       form.paymentMethod === method ? "#fff" : "#374151",
                      }}
                    >
                      {method === "CASH" ? "💵 Cash" : method === "ZAAD" ? "📱 Zaad" : "✏️ Other"}
                    </button>
                  ))}
                </div>
              </div>

              {form.paymentMethod === "OTHER" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>How was it received? *</label>
                  <input
                    type="text"
                    value={form.paymentNote}
                    onChange={e => setForm(f => ({ ...f, paymentNote: e.target.value }))}
                    placeholder="e.g. Bank transfer, EVC Plus, cheque…"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ border: "1px solid #e2e8f0", color: "#374151" }}
                  />
                </div>
              )}

              {selProd && form.qtyCtn > 0 && form.sellPricePerCtn > 0 && (
                <div className="rounded-xl p-4 text-xs space-y-2" style={{ background: "#f0f4ff" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Total Revenue</span>
                    <span className="font-mono font-bold" style={{ color: "#1e3a8a" }}>{fmt(form.qtyCtn * form.sellPricePerCtn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Payment via</span>
                    <span className="font-semibold" style={{ color: "#1e3a8a" }}>
                      {form.paymentMethod === "OTHER" ? (form.paymentNote || "Other") : form.paymentMethod}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={() => { setShowModal(false); setFormErr(""); }}>Cancel</Btn>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: "#1e3a8a", color: "#fff" }}>
                {submitting ? "Saving…" : "Record Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
