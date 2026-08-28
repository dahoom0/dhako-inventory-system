import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EXPENSES, fmt, type Expense } from "../data/mock";
import { Card, PageHeader, Btn, Th, Td } from "../components/ui";

const CAT_COLORS: Record<string, string> = {
  Rent: "#1e3a8a", Electricity: "#d97706", Transport: "#7c3aed", Staff: "#16a34a",
  Food: "#ea580c", Maintenance: "#64748b", Supplies: "#0369a1", Other: "#94a3b8",
};

const CATEGORIES = ["Transport", "Electricity", "Rent", "Staff", "Food", "Maintenance", "Supplies", "Other"] as const;

export default function Expenses() {
  const { user, getAccessibleLocations } = useAuth();
  
  // Only ADMIN can access Expenses
  if (user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#dc2626", fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Access Denied</div>
          <div style={{ color: "#64748b" }}>Only administrators can view expenses.</div>
        </Card>
      </div>
    );
  }

  const [expenses] = useState<Expense[]>(EXPENSES);
  const [branchFilter, setBranchFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  const filtered = expenses.filter(e =>
    (branchFilter === "All" || e.branch === branchFilter) &&
    (catFilter === "All" || e.category === catFilter)
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const byCategory = CATEGORIES.map(cat => ({
    cat, total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).sort((a, b) => b.total - a.total);

  const byBranch = ["Branch 1", "Branch 2", "Branch 3"].map(branch => ({
    branch, total: expenses.filter(e => e.branch === branch).reduce((s, e) => s + e.amount, 0)
  }));

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Expenses"
        subtitle="Branch operating expenses"
        action={<Btn>+ Add Expense</Btn>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {byBranch.map(b => (
          <Card key={b.branch} className="p-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>{b.branch}</div>
            <div className="text-lg font-bold" style={{ color: "#d97706" }}>{fmt(b.total)}</div>
          </Card>
        ))}
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Total</div>
          <div className="text-lg font-bold" style={{ color: "#1e3a8a" }}>{fmt(expenses.reduce((s, e) => s + e.amount, 0))}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Card className="p-4 md:col-span-2">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>By Category</div>
          <div className="space-y-2">
            {byCategory.filter(c => c.total > 0).map(c => {
              const pct = (c.total / expenses.reduce((s, e) => s + e.amount, 0)) * 100;
              return (
                <div key={c.cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: "#374151" }}>{c.cat}</span>
                    <span className="font-mono" style={{ color: "#64748b" }}>{fmt(c.total)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#f1f5f9" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: CAT_COLORS[c.cat] || "#64748b" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>Top Categories</div>
          <div className="space-y-2">
            {byCategory.filter(c => c.total > 0).map((c, i) => (
              <div key={c.cat} className="flex items-center gap-2 text-xs">
                <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[c.cat] || "#64748b" }} />
                <span className="flex-1" style={{ color: "#374151" }}>{c.cat}</span>
                <span className="font-mono font-semibold" style={{ color: "#374151" }}>{fmt(c.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 flex flex-wrap gap-3 border-b" style={{ borderColor: "#e2e8f0" }}>
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
            {["All", "Branch 1", "Branch 2", "Branch 3"].map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
            {["All", ...CATEGORIES].map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="ml-auto font-semibold text-sm" style={{ color: "#1e3a8a" }}>
            Total: {fmt(total)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["ID", "Date", "Branch", "Category", "Description", "Amount", "User"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(e => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <Td mono><span style={{ color: "#94a3b8" }}>{e.id}</span></Td>
                  <Td mono><span style={{ color: "#64748b" }}>{e.date}</span></Td>
                  <Td><span style={{ color: "#1e3a8a", fontWeight: 600 }}>{e.branch}</span></Td>
                  <Td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: `${CAT_COLORS[e.category]}18`, color: CAT_COLORS[e.category] || "#64748b" }}>
                      {e.category}
                    </span>
                  </Td>
                  <Td>{e.description}</Td>
                  <Td mono><span className="font-bold" style={{ color: "#d97706" }}>{fmt(e.amount)}</span></Td>
                  <Td><span style={{ color: "#94a3b8" }}>{e.user}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
