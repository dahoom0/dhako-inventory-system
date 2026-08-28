import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { expensesApi } from "../utils/api";
import { Card, PageHeader, Btn, Th, Td } from "../components/ui";

interface Expense {
  id: string;
  amount: number;
  category: string;
  location_id: string;
  date: string;
  description: string;
  created_by: string;
}

const CAT_COLORS: Record<string, string> = {
  Rent: "#1e3a8a", Electricity: "#d97706", Transport: "#7c3aed", Staff: "#16a34a",
  Food: "#ea580c", Maintenance: "#64748b", Supplies: "#0369a1", Other: "#94a3b8",
};

const CATEGORIES = ["Transport", "Electricity", "Rent", "Staff", "Food", "Maintenance", "Supplies", "Other"] as const;

const fmt = (n: number): string => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("💰 Fetching expenses from API...");
      const data = await expensesApi.getExpenses();
      console.log("✅ Expenses fetched:", data);
      setExpenses(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch expenses";
      console.error("❌ Error:", errorMsg);
      setError(errorMsg);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = expenses.filter(e =>
    (catFilter === "All" || e.category === catFilter)
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const byCategory = CATEGORIES.map(cat => ({
    cat, total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).sort((a, b) => b.total - a.total);

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#64748b" }}>Loading expenses...</div>
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

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Expenses"
        subtitle={`${expenses.length} expenses · ${fmt(expenses.reduce((s, e) => s + e.amount, 0))} total`}
        action={<Btn>+ Add Expense</Btn>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Card className="p-4 md:col-span-2">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>By Category</div>
          <div className="space-y-2">
            {byCategory.filter(c => c.total > 0).map(c => {
              const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
              const pct = totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0;
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
                {["ID", "Date", "Category", "Description", "Amount"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <Td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>No expenses found</Td>
                </tr>
              ) : (
                [...filtered].reverse().map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td mono><span style={{ color: "#94a3b8" }}>{e.id.slice(0, 8)}</span></Td>
                    <Td mono><span style={{ color: "#64748b" }}>{e.date}</span></Td>
                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: `${CAT_COLORS[e.category]}18`, color: CAT_COLORS[e.category] || "#64748b" }}>
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
    </div>
  );
}
