import { SALES, PRODUCTS, fmt, saleRevenue, saleProfit } from "../../data/mock";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, PageHeader, Th, Td } from "../../components/ui";

const stats = PRODUCTS.map(p => {
  const pSales = SALES.filter(s => s.productId === p.id);
  const ctns = pSales.reduce((s, x) => s + x.ctns, 0);
  const revenue = pSales.reduce((s, x) => s + saleRevenue(x), 0);
  const profit = pSales.reduce((s, x) => s + saleProfit(x), 0);
  const margin = revenue > 0 ? (profit / revenue * 100).toFixed(1) : "0.0";
  return { ...p, ctns, revenue, profit, margin };
}).sort((a, b) => b.revenue - a.revenue);

export default function SalesReport() {
  const totalRev = stats.reduce((s, p) => s + p.revenue, 0);
  const totalProfit = stats.reduce((s, p) => s + p.profit, 0);
  const totalCtns = stats.reduce((s, p) => s + p.ctns, 0);

  const chartData = stats.slice(0, 6).map(p => ({
    name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name,
    Revenue: p.revenue, Profit: p.profit,
  }));

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Sales Report" subtitle="August 2026 — Product performance" />
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[{ l: "Total Revenue", v: fmt(totalRev), c: "#1e3a8a" }, { l: "Gross Profit", v: fmt(totalProfit), c: "#16a34a" }, { l: "CTNs Sold", v: String(totalCtns), c: "#2563eb" }].map(x => (
          <Card key={x.l} className="p-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>{x.l}</div>
            <div className="text-xl font-bold" style={{ color: x.c }}>{x.v}</div>
          </Card>
        ))}
      </div>
      <Card className="p-5 mb-4">
        <div className="text-sm font-semibold mb-4" style={{ color: "#1e3a8a" }}>Revenue & Profit by Product</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
            <CartesianGrid stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`RM ${(v as number).toLocaleString()}`, ""]} />
            <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Profit" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["#", "Product", "Category", "CTNs Sold", "Revenue", "Profit", "Margin"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {stats.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <Td mono><span style={{ color: i < 3 ? "#1e3a8a" : "#94a3b8", fontWeight: i < 3 ? 700 : 400 }}>#{i + 1}</span></Td>
                  <Td><span className="font-semibold" style={{ color: "#1e3a8a" }}>{p.name}</span></Td>
                  <Td>{p.category}</Td>
                  <Td mono>{p.ctns}</Td>
                  <Td mono><span className="font-semibold">{p.revenue > 0 ? fmt(p.revenue) : "—"}</span></Td>
                  <Td mono><span style={{ color: "#16a34a", fontWeight: 600 }}>{p.profit > 0 ? fmt(p.profit) : "—"}</span></Td>
                  <Td mono><span style={{ color: parseFloat(p.margin) > 20 ? "#16a34a" : "#ca8a04", fontWeight: 600 }}>{p.margin}%</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
