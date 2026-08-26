import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { DEBTS, fmt, type Debt } from "../data/mock";
import { Card, PageHeader, Btn, Th, Td } from "../components/ui";

const STATUS_STYLE: Record<Debt["status"], { bg: string; text: string }> = {
  "Unpaid":         { bg: "#fee2e2", text: "#dc2626" },
  "Partially Paid": { bg: "#fef9c3", text: "#ca8a04" },
  "Paid":           { bg: "#dcfce7", text: "#16a34a" },
};

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

  const [debts, setDebts] = useState<Debt[]>(DEBTS);
  const [filter, setFilter] = useState("All");

  const outstanding = debts.filter(d => d.status !== "Paid").reduce((s, d) => s + (d.original - d.paid), 0);
  const unpaidCount = debts.filter(d => d.status === "Unpaid").length;
  const partialCount = debts.filter(d => d.status === "Partially Paid").length;

  const filtered = filter === "All" ? debts : debts.filter(d => d.status === filter);

  function recordPayment(id: string, amount: number) {
    setDebts(ds => ds.map(d => {
      if (d.id !== id) return d;
      const newPaid = Math.min(d.paid + amount, d.original);
      return { ...d, paid: newPaid, status: newPaid >= d.original ? "Paid" : newPaid > 0 ? "Partially Paid" : "Unpaid" };
    }));
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Debt Management" subtitle="Customer credit and outstanding balances" action={<Btn>+ Record Debt</Btn>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Outstanding</div>
          <div className="text-xl font-bold" style={{ color: "#dc2626" }}>{fmt(outstanding)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Unpaid</div>
          <div className="text-xl font-bold" style={{ color: "#dc2626" }}>{unpaidCount} debts</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Partially Paid</div>
          <div className="text-xl font-bold" style={{ color: "#ca8a04" }}>{partialCount} debts</div>
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
                {["ID", "Date", "Branch", "Customer", "Reference", "Original", "Paid", "Remaining", "Status", "Action"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(d => {
                const remaining = d.original - d.paid;
                const s = STATUS_STYLE[d.status];
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td mono><span style={{ color: "#94a3b8" }}>{d.id}</span></Td>
                    <Td mono><span style={{ color: "#64748b" }}>{d.date}</span></Td>
                    <Td><span style={{ color: "#1e3a8a", fontWeight: 600 }}>{d.branch}</span></Td>
                    <Td><span className="font-semibold">{d.customer}</span></Td>
                    <Td><span style={{ color: "#64748b" }}>{d.reference}</span></Td>
                    <Td mono>{fmt(d.original)}</Td>
                    <Td mono><span style={{ color: "#16a34a" }}>{fmt(d.paid)}</span></Td>
                    <Td mono><span className="font-bold" style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>{fmt(remaining)}</span></Td>
                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.text }}>
                        {d.status}
                      </span>
                    </Td>
                    <Td>
                      {d.status !== "Paid" && (
                        <button onClick={() => recordPayment(d.id, Math.min(100, remaining))}
                          className="px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                          + Payment
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
