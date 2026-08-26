import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
  PRODUCTS, SALES, EXPENSES, DEBTS, MOVEMENTS, SALES_TREND, BRANCH_PERF,
  totalStockCtn, stockStatus, inventoryValue, saleRevenue, saleProfit, fmt,
} from "../data/mock";
import { KPICard, Card, MovTypeBadge } from "../components/ui";

// ── Accounting ───────────────────────────────────────────────────────────────
const todayStr = "2026-08-25";

// Revenue & COGS from individual sale records (source of truth)
const allRevenue      = SALES.reduce((s, x) => s + saleRevenue(x), 0);
const allCOGS         = SALES.reduce((s, x) => s + x.ctns * x.costPrice, 0);
const allGrossProfit  = allRevenue - allCOGS;   // Revenue − COGS
const allExpenses     = EXPENSES.reduce((s, e) => s + e.amount, 0);
const allNetProfit    = allGrossProfit - allExpenses; // Gross Profit − Expenses

const todaySales      = SALES.filter(s => s.date === todayStr);
const todayRevenue    = todaySales.reduce((s, x) => s + saleRevenue(x), 0);
const todayCOGS       = todaySales.reduce((s, x) => s + x.ctns * x.costPrice, 0);
const todayGrossProfit = todayRevenue - todayCOGS;
const todayExpenses   = EXPENSES.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);
const todayNetProfit  = todayGrossProfit - todayExpenses;

const outstandingDebt = DEBTS.filter(d => d.status !== "Paid").reduce((s, d) => s + (d.original - d.paid), 0);
const invValue        = inventoryValue(PRODUCTS);
const lowAlerts       = PRODUCTS.flatMap(p =>
  Object.entries(p.stock).filter(([, qty]) => stockStatus(qty, p.minStock) !== "ok")
).length;

// Branch perf with correctly computed gross/net profit
const branchPerf = BRANCH_PERF.map(b => ({
  ...b,
  grossProfit: b.sales - b.cogs,
  netProfit:   b.sales - b.cogs - b.expenses,
}));

const ALERTS = [
  { type: "out",  msg: "Mineral Water 600ml — out of stock at Warehouse C." },
  { type: "out",  msg: "Green Tea 25-bag — out of stock at Warehouse C & Branch 2." },
  { type: "low",  msg: "Coca Cola 330ml — Branch 1 at 8 CTN (min 10)." },
  { type: "low",  msg: "Cooking Oil 1L — Branch 2 at 2 CTN (min 10)." },
  { type: "slow", msg: "Green Tea 25-bag has not moved for 30+ days at Warehouse B." },
];

export default function Dashboard() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Monday, 25 August 2026 — Company overview</p>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Today */}
        <KPICard label="Today's Revenue"     value={fmt(todayRevenue)}     sub={`${todaySales.length} sales`}   icon="💰" />
        <KPICard label="Today's Gross Profit" value={fmt(todayGrossProfit)} color="#16a34a"                      icon="📈" />
        <KPICard label="Today's Expenses"    value={fmt(todayExpenses)}    color="#d97706"                      icon="💸" />
        <KPICard label="Today's Net Profit"  value={fmt(todayNetProfit)}   color={todayNetProfit >= 0 ? "#1e3a8a" : "#dc2626"} icon="✅" />

        {/* Month */}
        <KPICard label="Monthly Revenue"     value={fmt(allRevenue)}      sub="Aug 2026"  />
        <KPICard label="Monthly Gross Profit" value={fmt(allGrossProfit)} color="#16a34a" />
        <KPICard label="Monthly Expenses"    value={fmt(allExpenses)}     color="#d97706" />
        <KPICard label="Monthly Net Profit"  value={fmt(allNetProfit)}    color="#1e3a8a" icon="🏆" />

        {/* Business */}
        <KPICard label="Inventory Value"     value={fmt(invValue)}        sub="cost basis" icon="📦" />
        <KPICard label="Outstanding Debt"    value={fmt(outstandingDebt)} color="#dc2626"  icon="📋" />
        <KPICard label="Stock Alerts"        value={String(lowAlerts)}    color="#d97706"  sub="low / out locations" />
        <KPICard label="Total Products"      value={String(PRODUCTS.length)} sub="active SKUs" />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="text-sm font-semibold mb-1" style={{ color: "#1e3a8a" }}>Revenue vs Gross Profit — 6 months</div>
          <div className="text-xs mb-4" style={{ color: "#94a3b8" }}>Gross Profit = Revenue − Cost of Goods Sold</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={SALES_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} /><stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${(v as number).toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="revenue" name="Revenue"       stroke="#2563eb" strokeWidth={2} fill="url(#revG)" />
              <Area type="monotone" dataKey="profit"  name="Gross Profit"  stroke="#16a34a" strokeWidth={2} fill="url(#prG)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: "#2563eb" }} /><span className="text-xs" style={{ color: "#94a3b8" }}>Revenue</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: "#16a34a" }} /><span className="text-xs" style={{ color: "#94a3b8" }}>Gross Profit</span></div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold mb-4" style={{ color: "#1e3a8a" }}>Branch Net Profit</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branchPerf} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <YAxis type="category" dataKey="branch" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${(v as number).toLocaleString()}`, ""]} />
              <Bar dataKey="grossProfit" name="Gross Profit" fill="#2563eb" radius={[0, 3, 3, 0]} />
              <Bar dataKey="netProfit"   name="Net Profit"   fill="#16a34a" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>⚠️ Inventory Alerts</div>
          <div className="space-y-2">
            {ALERTS.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg text-xs"
                style={{ background: a.type === "out" ? "#fee2e2" : a.type === "low" ? "#fef9c3" : "#f1f5f9" }}>
                <span className="flex-shrink-0">{a.type === "out" ? "🔴" : a.type === "low" ? "🟡" : "⚫"}</span>
                <span style={{ color: "#374151" }}>{a.msg}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent movements */}
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>Recent Movements</div>
          <div className="space-y-2">
            {[...MOVEMENTS].reverse().slice(0, 6).map(m => (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                <MovTypeBadge type={m.type} />
                <span className="flex-1 truncate" style={{ color: "#374151" }}>{m.product}</span>
                <span className="font-mono font-semibold" style={{ color: "#1e3a8a" }}>{m.ctns > 0 ? `+${m.ctns}` : m.ctns}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Outstanding debts */}
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: "#1e3a8a" }}>Outstanding Debts</div>
          <div className="space-y-2">
            {DEBTS.filter(d => d.status !== "Paid").length === 0
              ? <div className="text-xs text-center py-4" style={{ color: "#94a3b8" }}>No outstanding debts</div>
              : DEBTS.filter(d => d.status !== "Paid").map(d => (
                <div key={d.id} className="p-2.5 rounded-lg text-xs" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div className="flex justify-between">
                    <span className="font-semibold" style={{ color: "#374151" }}>{d.customer}</span>
                    <span className="font-mono font-bold" style={{ color: "#dc2626" }}>{fmt(d.original - d.paid)}</span>
                  </div>
                  <div style={{ color: "#94a3b8" }}>{d.branch} · {d.date}</div>
                </div>
              ))
            }
          </div>
        </Card>
      </div>

      {/* ── Branch comparison table ── */}
      <Card>
        <div className="p-4 border-b" style={{ borderColor: "#e2e8f0" }}>
          <div className="text-sm font-semibold" style={{ color: "#1e3a8a" }}>Branch P&L — August 2026</div>
          <div className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Net Profit = Revenue − COGS − Expenses</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Branch", "Revenue", "COGS", "Gross Profit", "Gross Margin", "Expenses", "Net Profit", "Orders"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branchPerf.map(b => {
                const grossMargin = (b.grossProfit / b.sales * 100).toFixed(1);
                return (
                  <tr key={b.branch} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#1e3a8a" }}>{b.branch}</td>
                    <td className="px-4 py-3 font-mono">{fmt(b.sales)}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#64748b" }}>{fmt(b.cogs)}</td>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#16a34a" }}>{fmt(b.grossProfit)}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#2563eb" }}>{grossMargin}%</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#d97706" }}>{fmt(b.expenses)}</td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>{fmt(b.netProfit)}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#64748b" }}>{b.orders}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f0f4ff" }}>
                <td className="px-4 py-3 font-bold text-xs uppercase" style={{ color: "#1e3a8a" }}>Total</td>
                <td className="px-4 py-3 font-mono font-bold">{fmt(branchPerf.reduce((s, b) => s + b.sales, 0))}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: "#64748b" }}>{fmt(branchPerf.reduce((s, b) => s + b.cogs, 0))}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: "#16a34a" }}>{fmt(branchPerf.reduce((s, b) => s + b.grossProfit, 0))}</td>
                <td className="px-4 py-3 font-mono" style={{ color: "#2563eb" }}>
                  {(branchPerf.reduce((s, b) => s + b.grossProfit, 0) / branchPerf.reduce((s, b) => s + b.sales, 0) * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: "#d97706" }}>{fmt(branchPerf.reduce((s, b) => s + b.expenses, 0))}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>{fmt(branchPerf.reduce((s, b) => s + b.netProfit, 0))}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: "#64748b" }}>{branchPerf.reduce((s, b) => s + b.orders, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
