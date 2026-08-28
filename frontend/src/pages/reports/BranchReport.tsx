import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { analyticsApi } from "../../utils/api";
import { Card, PageHeader, Th, Td } from "../../components/ui";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function BranchReport() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardStats = await analyticsApi.getDashboardStats();
        setStats(dashboardStats);
        console.log("Branch report stats:", dashboardStats);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch branch report:", err);
        setError("Failed to load branch report data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading branch report...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!stats || !stats.branchPerf || stats.branchPerf.length === 0) return <div className="p-6 text-center">No branch data available</div>;

  const branchData = stats.branchPerf.map((b: any) => {
    const revenue = b.revenue || 0;
    const cogs = b.cogs || 0;
    const expenses = b.expenses || 0;
    const gross = revenue - cogs;
    const net = gross - expenses;
    const margin = revenue > 0 ? (gross / revenue * 100).toFixed(1) : "0";
    const totalDebt = b.outstanding_debt || 0;
    
    return {
      ...b,
      sales: revenue,
      gross,
      net,
      margin,
      totalDebt,
      orders: b.orders_count || 0,
    };
  });

  const winner = branchData.reduce((a: any, b: any) => (a.net > b.net ? a : b), branchData[0]);

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Branch Comparison" subtitle="Side-by-side performance across all branches" />

      <div className="rounded-xl p-4 mb-5 flex items-center gap-4" style={{ background: "#dbeafe", border: "1px solid #bfdbfe" }}>
        <div className="text-3xl">🏆</div>
        <div>
          <div className="font-bold" style={{ color: "#1e3a8a" }}>{winner.branch_name} — Best Net Profit</div>
          <div className="text-sm" style={{ color: "#1d4ed8" }}>Net profit of {fmt(winner.net)} with {winner.margin}% gross margin</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {branchData.map((b: any) => (
          <Card key={b.branch_id} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "#dbeafe" }}>🏪</div>
              <div>
                <div className="font-bold" style={{ color: "#1e3a8a" }}>{b.branch_name}</div>
                <div className="text-xs" style={{ color: "#94a3b8" }}>{b.orders} orders</div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: "Sales", value: fmt(b.sales), color: "#374151" },
                { label: "COGS", value: fmt(b.cogs), color: "#64748b" },
                { label: "Gross Profit", value: fmt(b.gross), color: "#16a34a" },
                { label: "Expenses", value: fmt(b.expenses), color: "#d97706" },
                { label: "Net Profit", value: fmt(b.net), color: "#1e3a8a", bold: true },
                { label: "Outstanding Debt", value: fmt(b.totalDebt), color: "#dc2626" },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-1" style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#94a3b8" }}>{r.label}</span>
                  <span className="font-mono" style={{ color: r.color, fontWeight: r.bold ? 700 : 600 }}>{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-1">
                <span style={{ color: "#94a3b8" }}>Gross Margin</span>
                <span className="font-mono font-bold" style={{ color: "#2563eb" }}>{b.margin}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="text-sm font-semibold mb-4" style={{ color: "#1e3a8a" }}>Revenue vs Gross Profit vs Expenses</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={branchData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#f1f5f9" />
            <XAxis dataKey="branch_name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${(v as number).toLocaleString()}`, ""]} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
            <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gross" name="Gross Profit" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
