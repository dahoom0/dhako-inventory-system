import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocations } from "@/context/LocationContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { KPICard, Card } from "@/components/ui";
import { analyticsApi } from "@/utils/api";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function AdminDashboardWithBranches() {
  const { user } = useAuth();
  const { locations, getLocationName } = useLocations();
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardStats = await analyticsApi.getDashboardStats();
        setStats(dashboardStats);
        console.log("Admin dashboard stats:", dashboardStats);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch admin dashboard stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBranch]);

  // Get branch name for display
  const getBranchDisplay = () => {
    if (selectedBranch === "ALL") return "All Branches";
    return getLocationName(selectedBranch);
  };

  if (loading) return <div className="p-6 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!stats) return <div className="p-6 text-center">No data available</div>;

  const todayRevenue = stats.todayRevenue || 0;
  const todayGrossProfit = stats.todayGrossProfit || 0;
  const todayExpenses = stats.todayExpenses || 0;
  const todayNetProfit = stats.todayNetProfit || 0;
  const monthlyRevenue = stats.monthlyRevenue || 0;
  const monthlyGrossProfit = stats.monthlyGrossProfit || 0;
  const monthlyExpenses = stats.monthlyExpenses || 0;
  const monthlyNetProfit = stats.monthlyNetProfit || 0;
  const inventoryValue = stats.inventoryValue || 0;
  const outstandingDebt = stats.outstandingDebt || 0;
  const stockAlerts = stats.stockAlerts || 0;
  const totalProducts = stats.totalProducts || 0;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header with Branch Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {getBranchDisplay()}
          </p>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Branches</option>
            {locations
              .filter((loc) => loc.type === "BRANCH")
              .map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Today */}
        <KPICard
          label="Today's Revenue"
          value={fmt(todayRevenue)}
          sub={`${stats.todaySalesCount || 0} sales`}
          icon="💰"
        />
        <KPICard
          label="Today's Gross Profit"
          value={fmt(todayGrossProfit)}
          color="#16a34a"
          icon="📈"
        />
        <KPICard
          label="Today's Expenses"
          value={fmt(todayExpenses)}
          color="#d97706"
          icon="💸"
        />
        <KPICard
          label="Today's Net Profit"
          value={fmt(todayNetProfit)}
          color={todayNetProfit >= 0 ? "#1e3a8a" : "#dc2626"}
          icon="✅"
        />

        {/* Month */}
        <KPICard label="Monthly Revenue" value={fmt(monthlyRevenue)} sub="This month" />
        <KPICard
          label="Monthly Gross Profit"
          value={fmt(monthlyGrossProfit)}
          color="#16a34a"
        />
        <KPICard
          label="Monthly Expenses"
          value={fmt(monthlyExpenses)}
          color="#d97706"
        />
        <KPICard
          label="Monthly Net Profit"
          value={fmt(monthlyNetProfit)}
          color="#1e3a8a"
          icon="🏆"
        />

        {/* Business */}
        <KPICard
          label="Inventory Value"
          value={fmt(inventoryValue)}
          sub="cost basis"
          icon="📦"
        />
        <KPICard
          label="Outstanding Debt"
          value={fmt(outstandingDebt)}
          color="#dc2626"
          icon="📋"
        />
        <KPICard
          label="Stock Alerts"
          value={String(stockAlerts)}
          color="#d97706"
          sub="low / out locations"
        />
        <KPICard
          label="Total Products"
          value={String(totalProducts)}
          sub="active SKUs"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div
            className="text-sm font-semibold mb-1"
            style={{ color: "#1e3a8a" }}
          >
            Revenue vs Gross Profit — {getBranchDisplay()}
          </div>
          <div className="text-xs mb-4" style={{ color: "#94a3b8" }}>
            Gross Profit = Revenue − Cost of Goods Sold
          </div>
          {stats.salesTrend && stats.salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.salesTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v / 1000}K`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`$${(v as number).toLocaleString()}`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#revG)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Gross Profit"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#prG)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-400">No trend data available</div>
          )}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded"
                style={{ background: "#2563eb" }}
              />
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                Revenue
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded"
                style={{ background: "#16a34a" }}
              />
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                Gross Profit
              </span>
            </div>
          </div>
        </Card>

        {/* Stock Alerts */}
        <Card className="p-5">
          <div
            className="text-sm font-semibold mb-3"
            style={{ color: "#1e3a8a" }}
          >
            Stock Alerts
          </div>
          <div className="space-y-2">
            {stats.alerts && stats.alerts.length > 0 ? (
              stats.alerts.slice(0, 5).map((alert: any, idx: number) => (
                <div
                  key={idx}
                  className="text-xs p-2 rounded"
                  style={{
                    background:
                      alert.type === "out"
                        ? "#fee2e2"
                        : alert.type === "low"
                          ? "#fef3c7"
                          : "#dbeafe",
                    color:
                      alert.type === "out"
                        ? "#991b1b"
                        : alert.type === "low"
                          ? "#92400e"
                          : "#1e40af",
                    border:
                      alert.type === "out"
                        ? "1px solid #fecaca"
                        : alert.type === "low"
                          ? "1px solid #fde68a"
                          : "1px solid #93c5fd",
                  }}
                >
                  {alert.type === "out" ? "🔴" : alert.type === "low" ? "🟡" : "🔵"} {alert.message}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs" style={{ color: "#94a3b8" }}>No alerts</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Branch Performance (only for "All Branches") ── */}
      {selectedBranch === "ALL" && stats.branchPerf && stats.branchPerf.length > 0 && (
        <Card className="p-5">
          <div
            className="text-sm font-semibold mb-3"
            style={{ color: "#1e3a8a" }}
          >
            Branch Performance
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.branchPerf}>
              <CartesianGrid stroke="#f1f5f9" />
              <XAxis
                dataKey="branch_name"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v / 1000}K`}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => `$${(v as number).toLocaleString()}`}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                iconType="circle"
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="gross_profit"
                name="Gross Profit"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="net_profit"
                name="Net Profit"
                fill="#0891b2"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
