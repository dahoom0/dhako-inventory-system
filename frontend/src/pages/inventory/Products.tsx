import { useState, useEffect } from "react";
import { productApi } from "../../utils/api";
import { Card, PageHeader, StatusBadge, Btn, Th, Td } from "../../components/ui";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const stockStatus = (qty: number, minStock: number) => {
  if (qty === 0) return "out";
  if (qty < minStock) return "low";
  return "ok";
};

const totalStockCtn = (product: any) => {
  if (!product.inventory_by_location) return 0;
  return product.inventory_by_location.reduce((sum: number, inv: any) => sum + (inv.quantity_ctns || 0), 0);
};

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productsData = await productApi.getProducts();
        setProducts(productsData);
        console.log("Products loaded:", productsData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading products...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category || "Other")))];
  const filtered = products.filter(p =>
    (cat === "All" || p.category === cat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Products" subtitle={`${products.length} active SKUs`} action={<Btn>+ Add Product</Btn>} />

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
              {filtered.length > 0 ? (
                filtered.map(p => {
                  const t = totalStockCtn(p);
                  const st = stockStatus(t, p.min_stock || 0);
                  const costPerCtn = p.cost_per_ctn || 0;
                  const sellPerCtn = p.selling_price_per_ctn || costPerCtn;
                  const margin = sellPerCtn > 0 ? ((sellPerCtn - costPerCtn) / sellPerCtn * 100).toFixed(0) : "0";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <Td mono><span style={{ color: "#94a3b8" }}>{p.sku}</span></Td>
                      <Td>
                        <div className="font-semibold" style={{ color: "#1e3a8a" }}>{p.name}</div>
                        <div className="text-xs" style={{ color: "#94a3b8" }}>unit</div>
                      </Td>
                      <Td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{p.category || "Other"}</span></Td>
                      <Td mono>{p.qty_per_ctn}</Td>
                      <Td mono>{fmt(costPerCtn)}</Td>
                      <Td mono>{fmt(sellPerCtn)}</Td>
                      <Td mono><span style={{ color: "#16a34a", fontWeight: 600 }}>{margin}%</span></Td>
                      <Td mono>{p.min_stock || 0}</Td>
                      <Td mono><span className="font-bold" style={{ color: "#1e3a8a" }}>{t}</span></Td>
                      <Td><StatusBadge status={st} /></Td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <Td colSpan={10} style={{ textAlign: "center", color: "#94a3b8" }}>No products found</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
