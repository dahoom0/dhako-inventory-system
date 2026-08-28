import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState, useEffect } from "react";
import { analyticsApi } from "../utils/api";
import { KPICard, Card } from "../components/ui";

// Format currency
const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

// Badge component for movement types
const MovTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    STOCK_RECEIVED: { bg: "#d1fae5", text: "#047857" },
    WAREHOUSE_TRANSFER: { bg: "#dbeafe", text: "#1e40af" },
    BRANCH_TRANSFER: { bg: "#fef3c7", text: "#b45309" },
    SALE: { bg: "#f0fdf4", text: "#15803d" },
    ADJUSTMENT: { bg: "#fae8ff", text: "#7e22ce" },
    RETURN: { bg: "#fee2e2", text: "#dc2626" },
  };
  const style = colors[type] || { bg: "#f3f4f6", text: "#374151" };
  return <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: style.bg, color: style.text }}>{type}</span>;
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardStats = await analyticsApi.getDashboardStats();
        setStats(dashboardStats);
        console.log("Dashboard stats:", dashboardStats);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!stats) return <div className="p-6 text-center">No data available</div>;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Company overview</p>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Today */}
        <KPICard label="Today's Revenue" value={fmt(stats.todayRevenue || 0)} sub={`${stats.todaySalesCount || 0} sales`} icon="💰" />
        <KPICard label="Today's Gross Profit" value={fmt(stats.todayGrossProfit || 0)} color="#16a34a" icon="📈" />
        <KPICard label="Today's Expenses" value={fmt(stats.todayExpenses || 0)} color="#d97706" icon="💸" />
        <KPICard label="Today's Net Profit" value={fmt(stats.todayNetProfit || 0)} color={stats.todayNetProfit >= 0 ? "#1e3a8a" : "#dc2626"} icon="✅" />

        {/* Month */}
        <KPICard label="Monthly Revenue" value={fmt(stats.monthlyRevenue || 0)} sub="This month" />
        <KPICard label="Monthly Gross Profit" value={fmt(stats.monthlyGrossProfit || 0)} color="#16a34a" />
        <KPICard label="Monthly Expenses" value={fmt(stats.monthlyExpenses || 0)} color="#d97706" />
        <KPICard label="Monthly Net Profit" value={fmt(stats.monthlyNetProfit || 0)} color="#1e3a8a" icon="🏆" />

        {/* Business */}
        <KPICard label="Inventory Value" value={fmt(stats.inventoryValue || 0)} sub="cost basis" icon="📦" />
        <KPICard label="Outstanding Debt" value={fmt(stats.outstandingDebt || 0)} color="#dc2626" icon="📋" />
        <KPICard label="Stock Alerts" value={String(stats.stockAlerts || 0)} color="#d97706" sub="low / out locations" />
        <KPICard label="Total Products" value={String(stats.totalProducts || 0)} sub="active SKUs" />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="text-sm font-semibold mb-1" style={{ color: "#1e3a8a" }}>Revenue vs Gross Profit — Trend</div>
          <div className="text-xs mb-4" style={{ color: "#94a3b8" }}>Gross Profit = Revenue − Cost of Goods Sold</div>
          {stats.salesTrend && stats.salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.salesTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} /><stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`$${(v as number).toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revG)" />
                <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#16a34a" strokeWidth={2} fill="url(#prG)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-400">No trend data available</div>
          )}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: "#2563eb" }} /><span className="text-xs" style={{ color: "#94a3b8" }}>Revenue</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: "#16a34a" }} /><span className="text-xs" style={{ color: "#94a3b8" }}>Gross Profit</span></div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold mb-4" style={{ color: "#1e3a8a" }}>Branch Net Profit</div>
          {stats.branchPerf && stats.branchPerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.branchPerf} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
                <YAxis type="category" dataKey="branch_name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`$${(v as number).toLocaleString()}`, ""]} />
                <Bar dataKey="gross_profit" name="Gross Profit" fill="#2563eb" radius={[0, 3, 3, 0]} />
                <Bar dataKey="net_profit" name="Net Profit" fill="#16a34a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-400">No branch data available</div>
          )}
        </Card>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>⚠️ Inventory Alerts</div>
          <div className="space-y-2">
            {stats.alerts && stats.alerts.length > 0 ? (
              stats.alerts.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg text-xs"
                  style={{ background: a.type === "out" ? "#fee2e2" : a.type === "low" ? "#fef9c3" : "#f1f5f9" }}>
                  <span className="flex-shrink-0">{a.type === "out" ? "🔴" : a.type === "low" ? "🟡" : "⚫"}</span>
                  <span style={{ color: "#374151" }}>{a.message}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs" style={{ color: "#94a3b8" }}>No alerts</div>
            )}
          </div>
        </Card>

        {/* Recent movements */}
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>Recent Movements</div>
          <div className="space-y-2">
            {stats.recentMovements && stats.recentMovements.length > 0 ? (
              stats.recentMovements.slice(0, 6).map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 text-xs">
                  <MovTypeBadge type={m.type} />
                  <span className="flex-1 truncate" style={{ color: "#374151" }}>{m.product_name}</span>
                  <span className="font-mono font-semibold" style={{ color: "#1e3a8a" }}>{m.quantity_ctns > 0 ? `+${m.quantity_ctns}` : m.quantity_ctns}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs" style={{ color: "#94a3b8" }}>No movements</div>
            )}
          </div>
        </Card>

        {/* Outstanding debts */}
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>Outstanding Debts</div>
          <div className="space-y-2">
            {stats.outstandingDebts && stats.outstandingDebts.length > 0 ? (
              stats.outstandingDebts.map((d: any) => (
                <div key={d.id} className="p-2.5 rounded-lg text-xs" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div className="flex justify-between">
                    <span className="font-semibold" style={{ color: "#374151" }}>{d.customer_name}</span>
                    <span className="font-mono font-bold" style={{ color: "#dc2626" }}>{fmt(d.amount_outstanding || 0)}</span>
                  </div>
                  <div style={{ color: "#94a3b8" }}>{d.branch_name} · {d.date}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs" style={{ color: "#94a3b8" }}>No outstanding debts</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Branch comparison table ── */}
      {stats.branchPerf && stats.branchPerf.length > 0 && (
        <Card>
          <div className="p-4 border-b" style={{ borderColor: "#e2e8f0" }}>
            <div className="text-sm font-semibold" style={{ color: "#1e3a8a" }}>Branch P&L</div>
            <div className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Net Profit = Revenue − COGS − Expenses</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Branch", "Revenue", "COGS", "Gross Profit", "Gross Margin", "Expenses", "Net Profit"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.branchPerf.map((b: any) => {
                  const revenue = b.revenue || 0;
                  const cogs = b.cogs || 0;
                  const expenses = b.expenses || 0;
                  const grossProfit = revenue - cogs;
                  const netProfit = grossProfit - expenses;
                  const grossMargin = revenue > 0 ? (grossProfit / revenue * 100).toFixed(1) : "0";
                  return (
                    <tr key={b.branch_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: "#1e3a8a" }}>{b.branch_name}</td>
                      <td className="px-4 py-3 font-mono">{fmt(revenue)}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: "#64748b" }}>{fmt(cogs)}</td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#16a34a" }}>{fmt(grossProfit)}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: "#2563eb" }}>{grossMargin}%</td>
                      <td className="px-4 py-3 font-mono" style={{ color: "#d97706" }}>{fmt(expenses)}</td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>{fmt(netProfit)}</td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f0f4ff" }}>
                  <td className="px-4 py-3 font-bold text-xs uppercase" style={{ color: "#1e3a8a" }}>Total</td>
                  <td className="px-4 py-3 font-mono font-bold">{fmt(stats.branchPerf.reduce((s: number, b: any) => s + (b.revenue || 0), 0))}</td>
                  <td className="px-4 py-3 font-mono font-bold" style={{ color: "#64748b" }}>{fmt(stats.branchPerf.reduce((s: number, b: any) => s + (b.cogs || 0), 0))}</td>
                  <td className="px-4 py-3 font-mono font-bold" style={{ color: "#16a34a" }}>{fmt(stats.branchPerf.reduce((s: number, b: any) => s + ((b.revenue || 0) - (b.cogs || 0)), 0))}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: "#2563eb" }}>
                    {(() => {
                      const totalRevenue = stats.branchPerf.reduce((s: number, b: any) => s + (b.revenue || 0), 0);
                      const totalGrossProfit = stats.branchPerf.reduce((s: number, b: any) => s + ((b.revenue || 0) - (b.cogs || 0)), 0);
                      return totalRevenue > 0 ? (totalGrossProfit / totalRevenue * 100).toFixed(1) : "0";
                    })()}%
                  </td>
                  <td className="px-4 py-3 font-mono font-bold" style={{ color: "#d97706" }}>{fmt(stats.branchPerf.reduce((s: number, b: any) => s + (b.expenses || 0), 0))}</td>
                  <td className="px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                    {fmt(stats.branchPerf.reduce((s: number, b: any) => s + ((b.revenue || 0) - (b.cogs || 0) - (b.expenses || 0)), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
