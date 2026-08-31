import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { expensesApi, locationApi } from "../utils/api";
import { Card, PageHeader, Btn, Th, Td } from "../components/ui";

const fmt = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const CAT_COLORS: Record<string, string> = {
  TRANSPORT: "#7c3aed", ELECTRICITY: "#d97706", RENT: "#1e3a8a",
  STAFF: "#16a34a", FOOD: "#ea580c", MAINTENANCE: "#64748b",
  SUPPLIES: "#0369a1", OTHER: "#94a3b8",
};

const CATEGORIES = ["TRANSPORT","ELECTRICITY","RENT","STAFF","FOOD","MAINTENANCE","SUPPLIES","OTHER"] as const;

const today = new Date().toISOString().split("T")[0];

export default function Expenses() {
  const { user } = useAuth();

  // ── All hooks MUST come before any conditional return ──────────────────
  const [expenses, setExpenses]   = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr]     = useState("");
  const [form, setForm]           = useState({
    locationId: "", category: "OTHER" as typeof CATEGORIES[number],
    description: "", amount: "", date: today,
  });

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    Promise.all([
      expensesApi.getExpenses().then(r => {
        // paginated: API wrapper returns { data: [...], total, ... }
        const rows = Array.isArray(r) ? r : ((r as any)?.data ?? []);
        setExpenses(rows);
      }),
      locationApi.getLocations().then(r => {
        setLocations(Array.isArray(r) ? r : r ?? []);
      }),
    ])
      .catch(e => setError(e?.message || "Failed to load data"))
      .finally(() => setLoading(false));
  }, [user?.role]);

  // ── Access guard ───────────────────────────────────────────────────────
  if (user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="text-lg font-bold text-red-600 mb-2">Access Denied</div>
          <div className="text-gray-500">Only administrators can view expenses.</div>
        </Card>
      </div>
    );
  }

  if (loading) return <div className="p-6"><Card className="p-8 text-center text-gray-500">Loading expenses…</Card></div>;
  if (error)   return <div className="p-6"><Card className="p-8 text-center text-red-600">Error: {error}</Card></div>;

  const filtered = catFilter === "All" ? expenses : expenses.filter(e => e.category === catFilter);
  const total    = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).sort((a, b) => b.total - a.total);

  const grandTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function handleSubmit() {
    setFormErr("");
    if (!form.locationId || !form.description || !form.amount || Number(form.amount) <= 0) {
      setFormErr("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await expensesApi.createExpense({
        locationId: form.locationId,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
      });
      const r = await expensesApi.getExpenses();
      setExpenses(Array.isArray(r) ? r : (r as any)?.data ?? []);
      setShowModal(false);
      setForm({ locationId: "", category: "OTHER", description: "", amount: "", date: today });
    } catch (e: any) {
      setFormErr(e?.message || "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Expenses"
        subtitle={`${expenses.length} expenses · ${fmt(grandTotal)} total`}
        action={<Btn onClick={() => setShowModal(true)}>+ Add Expense</Btn>}
      />

      {/* Category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-2">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>By Category</div>
          <div className="space-y-2">
            {byCategory.filter(c => c.total > 0).map(c => {
              const pct = grandTotal > 0 ? (c.total / grandTotal) * 100 : 0;
              return (
                <div key={c.cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: "#374151" }}>{c.cat}</span>
                    <span className="font-mono" style={{ color: "#64748b" }}>{fmt(c.total)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#f1f5f9" }}>
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: CAT_COLORS[c.cat] || "#64748b" }} />
                  </div>
                </div>
              );
            })}
            {byCategory.every(c => c.total === 0) && (
              <p className="text-xs text-gray-400 text-center py-2">No expense data yet</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>Summary</div>
          <div className="space-y-2">
            {byCategory.filter(c => c.total > 0).map(c => (
              <div key={c.cat} className="flex items-center gap-2 text-xs">
                <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[c.cat] || "#64748b" }} />
                <span className="flex-1" style={{ color: "#374151" }}>{c.cat}</span>
                <span className="font-mono font-semibold" style={{ color: "#374151" }}>{fmt(c.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-center border-b" style={{ borderColor: "#e2e8f0" }}>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="ml-auto font-semibold text-sm" style={{ color: "#1e3a8a" }}>Total: {fmt(total)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Date", "Location", "Category", "Description", "Amount"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><Td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>No expenses found</Td></tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td mono style={{ color: "#64748b" }}>{e.date}</Td>
                    <Td>{e.location_name}</Td>
                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: `${CAT_COLORS[e.category] || "#64748b"}18`, color: CAT_COLORS[e.category] || "#64748b" }}>
                        {e.category}
                      </span>
                    </Td>
                    <Td>{e.description}</Td>
                    <Td mono><span className="font-bold" style={{ color: "#d97706" }}>{fmt(e.amount)}</span></Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-5" style={{ color: "#1e3a8a" }}>Add Expense</h2>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Amount ($) *</label>
                  <input type="number" min={0} step="0.01" placeholder="0.00" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Description *</label>
                <input type="text" value={form.description} placeholder="What was the expense for?"
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Date *</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={() => { setShowModal(false); setFormErr(""); }}>Cancel</Btn>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: "#1e3a8a", color: "#fff" }}>
                {submitting ? "Saving…" : "Save Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
