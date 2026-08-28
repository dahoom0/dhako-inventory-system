import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { debtsApi } from "../utils/api";
import { Card, PageHeader, Btn, Th, Td } from "../components/ui";

interface Debt {
  id: string;
  customer_id: string;
  original_amount: number;
  paid_amount: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  location_id: string;
  created_at: string;
}

const STATUS_STYLE: Record<Debt["status"], { bg: string; text: string }> = {
  "UNPAID":         { bg: "#fee2e2", text: "#dc2626" },
  "PARTIALLY_PAID": { bg: "#fef9c3", text: "#ca8a04" },
  "PAID":           { bg: "#dcfce7", text: "#16a34a" },
};

const fmt = (n: number): string => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function Debts() {
  const { user, getAccessibleLocations } = useAuth();
  
  // Only ADMIN can access Debts
  if (user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#dc2626", fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Access Denied</div>
          <div style={{ color: "#64748b" }}>Only administrators can view debt records.</div>
        </Card>
      </div>
    );
  }

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("💳 Fetching debts from API...");
      const data = await debtsApi.getDebts();
      console.log("✅ Debts fetched:", data);
      setDebts(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch debts";
      console.error("❌ Error:", errorMsg);
      setError(errorMsg);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#64748b" }}>Loading debts...</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#dc2626" }}>Error: {error}</div>
        </Card>
      </div>
    );
  }

  const outstanding = debts.filter(d => d.status !== "PAID").reduce((s, d) => s + (d.original_amount - d.paid_amount), 0);
  const unpaidCount = debts.filter(d => d.status === "UNPAID").length;
  const partialCount = debts.filter(d => d.status === "PARTIALLY_PAID").length;

  const statusMap: Record<string, string> = {
    "UNPAID": "Unpaid",
    "PARTIALLY_PAID": "Partially Paid",
    "PAID": "Paid"
  };

  const filtered = filter === "All" ? debts : debts.filter(d => {
    if (filter === "Unpaid") return d.status === "UNPAID";
    if (filter === "Partially Paid") return d.status === "PARTIALLY_PAID";
    if (filter === "Paid") return d.status === "PAID";
    return true;
  });

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Debt Management" subtitle={`${debts.length} debts · ${fmt(outstanding)} outstanding`} action={<Btn>+ Record Debt</Btn>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Outstanding</div>
          <div className="text-xl font-bold" style={{ color: "#dc2626" }}>{fmt(outstanding)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Unpaid</div>
          <div className="text-xl font-bold" style={{ color: "#dc2626" }}>{unpaidCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Partially Paid</div>
          <div className="text-xl font-bold" style={{ color: "#ca8a04" }}>{partialCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Total Debts</div>
          <div className="text-xl font-bold" style={{ color: "#1e3a8a" }}>{debts.length}</div>
        </Card>
      </div>

      <Card>
        <div className="p-4 flex gap-2 border-b" style={{ borderColor: "#e2e8f0" }}>
          {["All", "Unpaid", "Partially Paid", "Paid"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: filter === f ? "#1e3a8a" : "#f1f5f9",
                color: filter === f ? "#fff" : "#64748b",
              }}>
              {f}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["ID", "Original Amount", "Paid Amount", "Remaining", "Status"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <Td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>No debts found</Td>
                </tr>
              ) : (
                [...filtered].reverse().map(d => {
                  const remaining = d.original_amount - d.paid_amount;
                  const s = STATUS_STYLE[d.status];
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <Td mono><span style={{ color: "#94a3b8" }}>{d.id.slice(0, 8)}</span></Td>
                      <Td mono>{fmt(d.original_amount)}</Td>
                      <Td mono><span style={{ color: "#16a34a" }}>{fmt(d.paid_amount)}</span></Td>
                      <Td mono><span className="font-bold" style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>{fmt(remaining)}</span></Td>
                      <Td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.text }}>
                          {statusMap[d.status]}
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
