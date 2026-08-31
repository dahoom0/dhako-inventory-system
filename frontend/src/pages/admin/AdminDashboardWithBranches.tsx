import React, { useState, useEffect } from "react";
import { useLocations } from "@/context/LocationContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from "recharts";
import { KPICard, Card } from "@/components/ui";
import { analyticsApi } from "@/utils/api";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt   = (n: number) => `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmtD  = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = new Date().toISOString().split("T")[0];
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().split("T")[0];

const BRANCH_COLORS = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2"];

type Preset = "today" | "7d" | "30d" | "month" | "custom";

// ── component ─────────────────────────────────────────────────────────────────
export default function AdminDashboardWithBranches() {
  const { locations } = useLocations();
  const branches = locations.filter(l => l.type === "BRANCH");

  const [locationId, setLocationId] = useState("ALL");
  const [preset, setPreset]         = useState<Preset>("today");
  const [dateFrom, setDateFrom]     = useState(today);
  const [dateTo, setDateTo]         = useState(today);
  const [stats, setStats]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (preset === "today") { setDateFrom(today);       setDateTo(today); }
    if (preset === "7d")    { setDateFrom(daysAgo(7));  setDateTo(today); }
    if (preset === "30d")   { setDateFrom(daysAgo(30)); setDateTo(today); }
    if (preset === "month") {
      const n = new Date();
      setDateFrom(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`);
      setDateTo(today);
    }
  }, [preset]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const params: any = { dateFrom, dateTo };
        if (locationId !== "ALL") params.locationId = locationId;
        const data = await analyticsApi.getDashboardStats(params);
        if (!cancelled) setStats(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [locationId, dateFrom, dateTo]);

  const locationLabel = locationId === "ALL"
    ? "All Branches"
    : locations.find(l => l.id === locationId)?.name || locationId;
  const rangeLabel = preset === "today" ? "Today" : `${dateFrom} → ${dateTo}`;

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const s = stats || {};
  const topProducts: any[] = s.topProducts || [];
  const branchPerf: any[]  = s.branchPerf  || [];
  const salesTrend: any[]  = s.salesTrend  || [];

  // Best selling = most CTN sold; Most profitable = highest gross profit
  const bySales  = [...topProducts].sort((a, b) => b.qtyCtnsSold  - a.qtyCtnsSold);
  const byProfit = [...topProducts].sort((a, b) => b.grossProfit  - a.grossProfit);
  const byMargin = [...topProducts].sort((a, b) => b.marginPct    - a.marginPct);

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Header + Filter bar ── */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>Admin Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{locationLabel} · {rangeLabel}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {(["today","7d","30d","month","custom"] as Preset[]).map(p => (
            <button key={p} onClick={() => setPreset(p)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
              style={{
                background:  preset === p ? "#1e3a8a" : "#fff",
                color:       preset === p ? "#fff" : "#374151",
                borderColor: preset === p ? "#1e3a8a" : "#e2e8f0",
              }}>
              {p === "today" ? "Today" : p === "7d" ? "Last 7 days" : p === "30d" ? "Last 30 days" : p === "month" ? "This month" : "Custom"}
            </button>
          ))}

          {preset === "custom" && (
            <>
              <input type="date" value={dateFrom} max={dateTo}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm border" style={{ borderColor: "#e2e8f0", color: "#374151" }} />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={dateTo} min={dateFrom} max={today}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm border" style={{ borderColor: "#e2e8f0", color: "#374151" }} />
            </>
          )}

          <div className="h-5 w-px bg-gray-200" />

          <select value={locationId} onChange={e => setLocationId(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border" style={{ borderColor: "#e2e8f0", color: "#374151" }}>
            <option value="ALL">All Branches</option>
            {branches.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading analytics…</p>
        </div>
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPICard label="Revenue"      value={fmt(s.todayRevenue      ?? 0)} sub={`${s.todaySalesCount ?? 0} sales`}  icon="💰" />
            <KPICard label="Gross Profit" value={fmt(s.todayGrossProfit  ?? 0)} color="#16a34a" icon="📈" />
            <KPICard label="Expenses"     value={fmt(s.todayExpenses     ?? 0)} color="#d97706" icon="💸" />
            <KPICard label="Net Profit"   value={fmt(s.todayNetProfit    ?? 0)} color={(s.todayNetProfit ?? 0) >= 0 ? "#1e3a8a" : "#dc2626"} icon="✅" />
            <KPICard label="Inventory Value"  value={fmt(s.inventoryValue   ?? 0)} sub="cost basis" icon="📦" />
            <KPICard label="Outstanding Debt" value={fmt(s.outstandingDebt  ?? 0)} color="#dc2626" icon="📋" />
            <KPICard label="Stock Alerts"     value={String(s.stockAlerts   ?? 0)} color="#d97706" sub="low / out" />
            <KPICard label="Total Products"   value={String(s.totalProducts ?? 0)} sub="active SKUs" />
          </div>

          {/* ── Revenue trend ── */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-sm font-bold" style={{ color: "#1e3a8a" }}>Revenue vs Gross Profit</div>
                <div className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{locationLabel} · {rangeLabel}</div>
              </div>
              <div className="flex gap-4">
                {[{ c: "#2563eb", label: "Revenue" }, { c: "#16a34a", label: "Profit" }].map(x => (
                  <div key={x.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: x.c }} />
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{x.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesTrend} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    {[["revG","#2563eb"],["prG","#16a34a"]].map(([id, color]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                    formatter={v => [`$${(v as number).toLocaleString()}`, ""]} />
                  <Area type="monotone" dataKey="revenue" name="Revenue"      stroke="#2563eb" strokeWidth={2} fill="url(#revG)" />
                  <Area type="monotone" dataKey="profit"  name="Gross Profit" stroke="#16a34a" strokeWidth={2} fill="url(#prG)"  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No sales data for this period</div>
            )}
          </Card>

          {/* ── Section: Product Analytics ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: "#1e3a8a" }} />
              <h2 className="text-base font-bold" style={{ color: "#1e3a8a" }}>Product Analytics</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                {rangeLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Best Selling */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🏆</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#374151" }}>Best Selling</div>
                    <div className="text-xs" style={{ color: "#94a3b8" }}>by cartons sold</div>
                  </div>
                </div>
                {bySales.filter(p => p.qtyCtnsSold > 0).length === 0 ? (
                  <div className="text-xs text-center py-6" style={{ color: "#94a3b8" }}>No sales this period</div>
                ) : (
                  <div className="space-y-3">
                    {bySales.filter(p => p.qtyCtnsSold > 0).slice(0, 5).map((p, i) => {
                      const max = bySales[0]?.qtyCtnsSold || 1;
                      const pct = (p.qtyCtnsSold / max) * 100;
                      return (
                        <div key={p.id}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold w-4 flex-shrink-0" style={{ color: i === 0 ? "#d97706" : "#94a3b8" }}>
                                #{i + 1}
                              </span>
                              <span className="text-xs font-semibold truncate" style={{ color: "#374151" }}>{p.name}</span>
                            </div>
                            <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: "#1e3a8a" }}>
                              {p.qtyCtnsSold} CTN
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "#f1f5f9" }}>
                            <div className="h-1.5 rounded-full transition-all" style={{
                              width: `${pct}%`,
                              background: i === 0 ? "#d97706" : i === 1 ? "#2563eb" : "#94a3b8"
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Most Profitable */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💎</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#374151" }}>Most Profitable</div>
                    <div className="text-xs" style={{ color: "#94a3b8" }}>by gross profit</div>
                  </div>
                </div>
                {byProfit.filter(p => p.grossProfit > 0).length === 0 ? (
                  <div className="text-xs text-center py-6" style={{ color: "#94a3b8" }}>No sales this period</div>
                ) : (
                  <div className="space-y-3">
                    {byProfit.filter(p => p.grossProfit > 0).slice(0, 5).map((p, i) => {
                      const max = byProfit[0]?.grossProfit || 1;
                      const pct = (p.grossProfit / max) * 100;
                      return (
                        <div key={p.id}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold w-4 flex-shrink-0" style={{ color: i === 0 ? "#16a34a" : "#94a3b8" }}>
                                #{i + 1}
                              </span>
                              <span className="text-xs font-semibold truncate" style={{ color: "#374151" }}>{p.name}</span>
                            </div>
                            <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: "#16a34a" }}>
                              {fmtD(p.grossProfit)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "#f1f5f9" }}>
                            <div className="h-1.5 rounded-full transition-all" style={{
                              width: `${pct}%`,
                              background: i === 0 ? "#16a34a" : i === 1 ? "#2563eb" : "#94a3b8"
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Best Margin */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📊</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#374151" }}>Best Margin</div>
                    <div className="text-xs" style={{ color: "#94a3b8" }}>profit / revenue %</div>
                  </div>
                </div>
                {byMargin.filter(p => p.marginPct > 0).length === 0 ? (
                  <div className="text-xs text-center py-6" style={{ color: "#94a3b8" }}>No sales this period</div>
                ) : (
                  <div className="space-y-3">
                    {byMargin.filter(p => p.marginPct > 0).slice(0, 5).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold w-4 flex-shrink-0" style={{ color: i === 0 ? "#7c3aed" : "#94a3b8" }}>
                            #{i + 1}
                          </span>
                          <span className="text-xs font-semibold truncate" style={{ color: "#374151" }}>{p.name}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                          {p.marginPct}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Product table */}
            {topProducts.filter(p => p.qtyCtnsSold > 0).length > 0 && (
              <Card className="mt-4">
                <div className="p-4 border-b" style={{ borderColor: "#e2e8f0" }}>
                  <div className="text-sm font-bold" style={{ color: "#374151" }}>All Products — Period Summary</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                        {["Product", "SKU", "CTN Sold", "Revenue", "Gross Profit", "Margin"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: i < 3 ? "#dbeafe" : "#f1f5f9", color: i < 3 ? "#1d4ed8" : "#94a3b8" }}>
                                {i + 1}
                              </div>
                              <span className="text-sm font-semibold" style={{ color: "#1e3a8a" }}>{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: "#64748b" }}>{p.sku}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold" style={{ color: p.qtyCtnsSold > 0 ? "#374151" : "#94a3b8" }}>
                              {p.qtyCtnsSold}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold" style={{ color: "#1e3a8a" }}>{fmtD(p.revenue)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold" style={{ color: p.grossProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                              {fmtD(p.grossProfit)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.marginPct > 0 ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: p.marginPct > 20 ? "#dcfce7" : "#fef9c3", color: p.marginPct > 20 ? "#16a34a" : "#ca8a04" }}>
                                {p.marginPct}%
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: "#94a3b8" }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* ── Section: Branch Comparison ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: "#16a34a" }} />
              <h2 className="text-base font-bold" style={{ color: "#1e3a8a" }}>Branch Sales Comparison</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#dcfce7", color: "#16a34a" }}>
                {rangeLabel}
              </span>
            </div>

            {/* Only BRANCH type — warehouses don't sell */}
            {branchPerf.filter(b => b.type === "BRANCH").length === 0 ? (
              <Card className="p-8 text-center text-gray-400 text-sm">No branch sales data for this period</Card>
            ) : (
              <>
                <Card className="p-5 mb-4">
                  <div className="text-sm font-bold mb-4" style={{ color: "#374151" }}>Revenue · Gross Profit · Expenses · Net Profit</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={branchPerf.filter(b => b.type === "BRANCH")} margin={{ top: 4, right: 4, bottom: 4, left: 0 }} barGap={2}>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                        formatter={v => [`$${(v as number).toLocaleString()}`, ""]} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" />
                      <Bar dataKey="revenue"     name="Revenue"      fill="#2563eb" radius={[4,4,0,0]} maxBarSize={40} />
                      <Bar dataKey="grossProfit" name="Gross Profit" fill="#16a34a" radius={[4,4,0,0]} maxBarSize={40} />
                      <Bar dataKey="expenses"    name="Expenses"     fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={40} />
                      <Bar dataKey="netProfit"   name="Net Profit"   fill="#0891b2" radius={[4,4,0,0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchPerf.filter(b => b.type === "BRANCH").map((b, i) => {
                    const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
                    return (
                      <Card key={b.id} className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                            style={{ background: color }}>
                            {b.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold truncate" style={{ color: "#1e3a8a" }}>{b.name}</div>
                            <div className="text-xs" style={{ color: "#94a3b8" }}>Branch · {b.saleCount} sales</div>
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { label: "Revenue",      value: b.revenue,     color: "#2563eb" },
                            { label: "Gross Profit", value: b.grossProfit, color: "#16a34a" },
                            { label: "Expenses",     value: b.expenses,    color: "#f59e0b" },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                                <span className="text-xs" style={{ color: "#64748b" }}>{row.label}</span>
                              </div>
                              <span className="text-xs font-semibold font-mono" style={{ color: row.color }}>{fmtD(row.value)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t" style={{ borderColor: "#f1f5f9" }}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold" style={{ color: "#374151" }}>Net Profit</span>
                              <span className="text-sm font-bold font-mono" style={{ color: b.netProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                                {b.netProfit >= 0 ? "+" : ""}{fmtD(b.netProfit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Section: Warehouse Stock Levels ── */}
          <WarehouseStockSection />
        </>
      )}
    </div>
  );
}

// ── Warehouse Stock Section ───────────────────────────────────────────────────
function WarehouseStockSection() {
  const [matrix, setMatrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/utils/api").then(({ inventoryApi }) => {
      inventoryApi.getInventoryMatrix()
        .then((r: any) => {
          const arr: any[] = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
          setMatrix(arr);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  // Group by warehouse
  const warehouses = matrix
    .filter(item => item.locationType === "WAREHOUSE")
    .reduce((acc: any, item: any) => {
      if (!acc[item.locationId]) {
        acc[item.locationId] = { id: item.locationId, name: item.locationName, products: [] };
      }
      acc[item.locationId].products.push(item);
      return acc;
    }, {} as Record<string, any>);

  const warehouseList: any[] = Object.values(warehouses);

  if (loading) return null;
  if (warehouseList.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#7c3aed" }} />
        <h2 className="text-base font-bold" style={{ color: "#1e3a8a" }}>Warehouse Stock Levels</h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
          Live inventory
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {warehouseList.map((wh, wi) => {
          const totalCtns  = wh.products.reduce((s: number, p: any) => s + (p.qtyCtn  || 0), 0);
          const totalUnits = wh.products.reduce((s: number, p: any) => s + (p.qtyUnits || 0), 0);
          const totalValue = wh.products.reduce((s: number, p: any) => s + (parseFloat(p.costValue) || 0), 0);
          const maxCtns    = Math.max(...wh.products.map((p: any) => p.qtyCtn || 0), 1);
          const whColor    = wi === 0 ? "#7c3aed" : "#0891b2";

          return (
            <Card key={wh.id} className="p-5">
              {/* Warehouse header */}
              <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: whColor }}>
                  🏭
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold" style={{ color: "#1e3a8a" }}>{wh.name}</div>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>Warehouse · {wh.products.length} products</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold font-mono" style={{ color: whColor }}>{totalCtns}</div>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>total CTN</div>
                </div>
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Products", value: wh.products.length, unit: "SKUs" },
                  { label: "Units",    value: totalUnits.toLocaleString(), unit: "pcs" },
                  { label: "Value",    value: `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, unit: "cost" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg p-3 text-center" style={{ background: "#f8fafc" }}>
                    <div className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{stat.label}</div>
                    <div className="text-base font-bold mt-0.5" style={{ color: "#374151" }}>{stat.value}</div>
                    <div className="text-xs" style={{ color: "#94a3b8" }}>{stat.unit}</div>
                  </div>
                ))}
              </div>

              {/* Per-product breakdown with bar */}
              <div className="space-y-3">
                {[...wh.products].sort((a: any, b: any) => b.qtyCtn - a.qtyCtn).map((p: any) => {
                  const pct = (p.qtyCtn / maxCtns) * 100;
                  const val = parseFloat(p.costValue) || 0;
                  return (
                    <div key={p.productId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold truncate" style={{ color: "#374151" }}>{p.productName}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="text-xs" style={{ color: "#64748b" }}>
                            {p.qtyUnits?.toLocaleString()} units
                          </span>
                          <span className="text-xs font-bold font-mono" style={{ color: whColor }}>
                            {p.qtyCtn} CTN
                          </span>
                          <span className="text-xs font-mono" style={{ color: "#94a3b8" }}>
                            ${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "#f1f5f9" }}>
                        <div className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: whColor, opacity: 0.7 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
