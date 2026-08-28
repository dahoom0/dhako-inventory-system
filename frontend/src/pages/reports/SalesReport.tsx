import { useState, useEffect } from "react";
import { salesApi, productApi } from "../../utils/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, PageHeader, Th, Td } from "../../components/ui";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function SalesReport() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salesData, productsData] = await Promise.all([
          salesApi.getSales(),
          productApi.getProducts(),
        ]);

        // Calculate stats per product
        const statsMap = new Map();
        
        // Initialize with all products
        productsData.forEach((p: any) => {
          statsMap.set(p.id, {
            ...p,
            ctns: 0,
            revenue: 0,
            profit: 0,
            margin: "0.0",
          });
        });

        // Aggregate sales data
        salesData.forEach((sale: any) => {
          const existing = statsMap.get(sale.product_id) || { id: sale.product_id, name: "Unknown", ctns: 0, revenue: 0, profit: 0 };
          const saleRevenue = sale.quantity_ctns * (sale.sale_price_per_ctn || 0);
          const saleCost = sale.quantity_ctns * (sale.cost_price_per_ctn || 0);
          const saleProfit = saleRevenue - saleCost;

          existing.ctns += sale.quantity_ctns;
          existing.revenue += saleRevenue;
          existing.profit += saleProfit;
          existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue * 100).toFixed(1) : "0.0";
          
          statsMap.set(sale.product_id, existing);
        });

        const finalStats = Array.from(statsMap.values()).sort((a: any, b: any) => b.revenue - a.revenue);
        setStats(finalStats);
        console.log("Sales report stats:", finalStats);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch sales report:", err);
        setError("Failed to load sales report data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading sales report...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const totalRev = stats.reduce((s, p) => s + p.revenue, 0);
  const totalProfit = stats.reduce((s, p) => s + p.profit, 0);
  const totalCtns = stats.reduce((s, p) => s + p.ctns, 0);

  const chartData = stats.slice(0, 6).map((p: any) => ({
    name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name,
    Revenue: p.revenue,
    Profit: p.profit,
  }));

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Sales Report" subtitle="Product performance" />
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[{ l: "Total Revenue", v: fmt(totalRev), c: "#1e3a8a" }, { l: "Gross Profit", v: fmt(totalProfit), c: "#16a34a" }, { l: "CTNs Sold", v: String(totalCtns), c: "#2563eb" }].map(x => (
          <Card key={x.l} className="p-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>{x.l}</div>
            <div className="text-xl font-bold" style={{ color: x.c }}>{x.v}</div>
          </Card>
        ))}
      </div>
      {chartData.length > 0 && (
        <Card className="p-5 mb-4">
          <div className="text-sm font-semibold mb-4" style={{ color: "#1e3a8a" }}>Revenue & Profit by Product</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${(v as number).toLocaleString()}`, ""]} />
              <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["#", "Product", "Category", "CTNs Sold", "Revenue", "Profit", "Margin"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {stats.map((p: any, i: number) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <Td mono><span style={{ color: i < 3 ? "#1e3a8a" : "#94a3b8", fontWeight: i < 3 ? 700 : 400 }}>#{i + 1}</span></Td>
                  <Td><span className="font-semibold" style={{ color: "#1e3a8a" }}>{p.name}</span></Td>
                  <Td>{p.category || "—"}</Td>
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
