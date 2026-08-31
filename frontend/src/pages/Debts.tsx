import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { debtsApi } from "../utils/api";
import { Card, PageHeader, Btn, Th, Td } from "../components/ui";

const fmt = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  UNPAID:         { bg: "#fee2e2", text: "#dc2626" },
  PARTIALLY_PAID: { bg: "#fef9c3", text: "#ca8a04" },
  PAID:           { bg: "#dcfce7", text: "#16a34a" },
};

export default function Debts() {
  const { user } = useAuth();

  // ── All hooks MUST come before any conditional return ──────────────────
  const [debts, setDebts]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState("All");

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    debtsApi.getDebts()
      .then(r => {
        // paginated: API wrapper returns { data: [...], total, ... }
        const rows = Array.isArray(r) ? r : ((r as any)?.data ?? []);
        setDebts(rows);
      })
      .catch(e => setError(e?.message || "Failed to load debts"))
      .finally(() => setLoading(false));
  }, [user?.role]);

  // ── Access guard ───────────────────────────────────────────────────────
  if (user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="text-lg font-bold text-red-600 mb-2">Access Denied</div>
          <div className="text-gray-500">Only administrators can view debt records.</div>
        </Card>
      </div>
    );
  }

  if (loading) return <div className="p-6"><Card className="p-8 text-center text-gray-500">Loading debts…</Card></div>;
  if (error)   return <div className="p-6"><Card className="p-8 text-center text-red-600">Error: {error}</Card></div>;

  // ── Derived values ──────────────────────────────────────────────────────
  const outstanding = debts
    .filter(d => d.status !== "PAID")
    .reduce((s, d) => s + (Number(d.original_amount) - Number(d.paid_amount)), 0);

  const counts = {
    unpaid:  debts.filter(d => d.status === "UNPAID").length,
    partial: debts.filter(d => d.status === "PARTIALLY_PAID").length,
    paid:    debts.filter(d => d.status === "PAID").length,
  };

  const filtered = debts.filter(d => {
    if (filter === "Unpaid")         return d.status === "UNPAID";
    if (filter === "Partially Paid") return d.status === "PARTIALLY_PAID";
    if (filter === "Paid")           return d.status === "PAID";
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Debt Management"
        subtitle={`${debts.length} debts · ${fmt(outstanding)} outstanding`}
        action={<Btn>+ Record Debt</Btn>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Outstanding",    value: fmt(outstanding), color: "#dc2626" },
          { label: "Unpaid",         value: counts.unpaid,    color: "#dc2626" },
          { label: "Partially Paid", value: counts.partial,   color: "#ca8a04" },
          { label: "Total Debts",    value: debts.length,     color: "#1e3a8a" },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>{c.label}</div>
            <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="p-4 flex gap-2 border-b" style={{ borderColor: "#e2e8f0" }}>
          {["All", "Unpaid", "Partially Paid", "Paid"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: filter === f ? "#1e3a8a" : "#f1f5f9", color: filter === f ? "#fff" : "#64748b" }}>
              {f}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Customer", "Location", "Date", "Original", "Paid", "Remaining", "Status"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><Td colSpan={7} style={{ textAlign: "center", color: "#94a3b8" }}>No debts found</Td></tr>
              ) : (
                filtered.map(d => {
                  const remaining = Number(d.original_amount) - Number(d.paid_amount);
                  const s = STATUS_STYLE[d.status] ?? { bg: "#f1f5f9", text: "#64748b" };
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <Td><span className="font-medium">{d.customer_name ?? d.customer_id?.slice(0, 8)}</span></Td>
                      <Td>{d.location_name}</Td>
                      <Td mono style={{ color: "#64748b" }}>{new Date(d.created_at).toLocaleDateString()}</Td>
                      <Td mono>{fmt(d.original_amount)}</Td>
                      <Td mono style={{ color: "#16a34a" }}>{fmt(d.paid_amount)}</Td>
                      <Td mono>
                        <span className="font-bold" style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>
                          {fmt(remaining)}
                        </span>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: s.bg, color: s.text }}>
                          {d.status.replace("_", " ")}
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
}
