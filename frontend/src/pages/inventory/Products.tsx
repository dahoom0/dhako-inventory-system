import { useState } from "react";
import { PRODUCTS, totalStockCtn, stockStatus, fmt } from "../../data/mock";
import { Card, PageHeader, StatusBadge, Btn, Th, Td } from "../../components/ui";

export default function Products() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");

  const categories = ["All", ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  const filtered = PRODUCTS.filter(p =>
    (cat === "All" || p.category === cat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Products" subtitle={`${PRODUCTS.length} active SKUs`} action={<Btn>+ Add Product</Btn>} />

      <Card>
        <div className="p-4 flex flex-wrap gap-3 border-b" style={{ borderColor: "#e2e8f0" }}>
          <input type="text" placeholder="Search name or SKU…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
          <select value={cat} onChange={e => setCat(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["SKU", "Product", "Category", "Qty/CTN", "Cost/CTN", "Sell/CTN", "Margin", "Min Stock", "Total CTN", "Status"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const t = totalStockCtn(p);
                const st = stockStatus(t, p.minStock);
                const margin = ((p.sellPerCtn - p.costPerCtn) / p.sellPerCtn * 100).toFixed(0);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td mono><span style={{ color: "#94a3b8" }}>{p.sku}</span></Td>
                    <Td>
                      <div className="font-semibold" style={{ color: "#1e3a8a" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "#94a3b8" }}>{p.unit}</div>
                    </Td>
                    <Td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{p.category}</span></Td>
                    <Td mono>{p.qtyPerCtn}</Td>
                    <Td mono>{fmt(p.costPerCtn)}</Td>
                    <Td mono>{fmt(p.sellPerCtn)}</Td>
                    <Td mono><span style={{ color: "#16a34a", fontWeight: 600 }}>{margin}%</span></Td>
                    <Td mono>{p.minStock}</Td>
                    <Td mono><span className="font-bold" style={{ color: "#1e3a8a" }}>{t}</span></Td>
                    <Td><StatusBadge status={st} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
