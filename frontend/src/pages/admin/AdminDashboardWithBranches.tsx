import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocations } from "@/context/LocationContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { KPICard, Card } from "@/components/ui";
import {
  PRODUCTS, SALES, EXPENSES, DEBTS, MOVEMENTS, SALES_TREND, BRANCH_PERF,
  totalStockCtn, stockStatus, inventoryValue, saleRevenue, fmt,
} from "../../data/mock";

const todayStr = "2026-08-25";

export default function AdminDashboardWithBranches() {
  const { user } = useAuth();
  const { locations, getLocationName } = useLocations();
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  // Filter data by selected branch
  const filterByBranch = (records: any[], locationField: string = "locationId"): any[] => {
    if (selectedBranch === "ALL") return records;
    return records.filter((r) => r[locationField] === selectedBranch);
  };

  // Get branch name for display
  const getBranchDisplay = () => {
    if (selectedBranch === "ALL") return "All Branches";
    return getLocationName(selectedBranch);
  };

  // Filter sales and expenses by branch
  const filteredSales = filterByBranch(SALES, "locationId");
  const filteredExpenses = filterByBranch(EXPENSES, "locationId");

  // Calculate KPIs based on filtered data
  const allRevenue = filteredSales.reduce((s, x) => s + saleRevenue(x), 0);
  const allCOGS = filteredSales.reduce((s, x) => s + x.ctns * x.costPrice, 0);
  const allGrossProfit = allRevenue - allCOGS;
  const allExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const allNetProfit = allGrossProfit - allExpenses;

  const todaySales = filteredSales.filter((s) => s.date === todayStr);
  const todayRevenue = todaySales.reduce((s, x) => s + saleRevenue(x), 0);
  const todayCOGS = todaySales.reduce((s, x) => s + x.ctns * x.costPrice, 0);
  const todayGrossProfit = todayRevenue - todayCOGS;
  const todayExpenses = filteredExpenses
    .filter((e) => e.date === todayStr)
    .reduce((s, e) => s + e.amount, 0);
  const todayNetProfit = todayGrossProfit - todayExpenses;

  const outstandingDebt = filterByBranch(DEBTS, "locationId")
    .filter((d) => d.status !== "Paid")
    .reduce((s, d) => s + (d.original - d.paid), 0);

  const invValue = inventoryValue(PRODUCTS);
  const lowAlerts = PRODUCTS.flatMap((p) =>
    Object.entries(p.stock).filter(([, qty]) => stockStatus(qty, p.minStock) !== "ok")
  ).length;

  // Get branch-specific sales trend data
  const getSalesTrendData = () => {
    if (selectedBranch === "ALL") return SALES_TREND;
    // Filter trend data by branch (in real app, this would be pre-aggregated)
    return SALES_TREND.map((month) => ({
      ...month,
      // In a real scenario, these would be pre-filtered by branch
      revenue: Math.floor((month.revenue * 0.3) + (Math.random() * 5000)), // Mock branch portion
      profit: Math.floor((month.profit * 0.3) + (Math.random() * 3000)),
    }));
  };

  const branchPerf = selectedBranch === "ALL"
    ? BRANCH_PERF.map((b) => ({
        ...b,
        grossProfit: b.sales - b.cogs,
        netProfit: b.sales - b.cogs - b.expenses,
      }))
    : [];

  const ALERTS = [
    { type: "out", msg: "Mineral Water 600ml — out of stock at Warehouse C." },
    { type: "out", msg: "Green Tea 25-bag — out of stock at Warehouse C & Branch 2." },
    { type: "low", msg: "Coca Cola 330ml — Branch 1 at 8 CTN (min 10)." },
    { type: "low", msg: "Cooking Oil 1L — Branch 2 at 2 CTN (min 10)." },
    { type: "slow", msg: "Green Tea 25-bag has not moved for 30+ days at Warehouse B." },
  ];

  // Filter alerts by selected branch
  const filteredAlerts = selectedBranch === "ALL"
    ? ALERTS
    : ALERTS.filter(
        (a) =>
          selectedBranch === "ALL" ||
          a.msg.includes("Warehouse") ||
          a.msg.includes(`Branch ${selectedBranch}`)
      );

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header with Branch Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Monday, 25 August 2026 — {getBranchDisplay()}
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
          sub={`${todaySales.length} sales`}
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
        <KPICard label="Monthly Revenue" value={fmt(allRevenue)} sub="Aug 2026" />
        <KPICard
          label="Monthly Gross Profit"
          value={fmt(allGrossProfit)}
          color="#16a34a"
        />
        <KPICard
          label="Monthly Expenses"
          value={fmt(allExpenses)}
          color="#d97706"
        />
        <KPICard
          label="Monthly Net Profit"
          value={fmt(allNetProfit)}
          color="#1e3a8a"
          icon="🏆"
        />

        {/* Business */}
        <KPICard
          label="Inventory Value"
          value={fmt(invValue)}
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
          value={String(lowAlerts)}
          color="#d97706"
          sub="low / out locations"
        />
        <KPICard
          label="Total Products"
          value={String(PRODUCTS.length)}
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
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={getSalesTrendData()} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
                dataKey="month"
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
            {filteredAlerts.map((alert, idx) => (
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
                {alert.type === "out" ? "🔴" : alert.type === "low" ? "🟡" : "🔵"} {alert.msg}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Branch Performance (only for "All Branches") ── */}
      {selectedBranch === "ALL" && (
        <Card className="p-5">
          <div
            className="text-sm font-semibold mb-3"
            style={{ color: "#1e3a8a" }}
          >
            Branch Performance
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchPerf}>
              <CartesianGrid stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
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
                dataKey="sales"
                name="Revenue"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="grossProfit"
                name="Gross Profit"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="netProfit"
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
