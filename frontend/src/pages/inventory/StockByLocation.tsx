import { useState, useEffect } from "react";
import { productApi, locationApi } from "../../utils/api";
import { Card, PageHeader, StatusBadge } from "../../components/ui";

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

export default function StockByLocation() {
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, locationsData] = await Promise.all([
          productApi.getProducts(),
          locationApi.getLocations(),
        ]);
        
        setProducts(productsData);
        setLocations(locationsData);
        
        console.log("Stock by location data:", { products: productsData, locations: locationsData });
        setError(null);
      } catch (err) {
        console.error("Failed to fetch stock by location data:", err);
        setError("Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading stock data...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Calculate totals
  const totalValue = products.reduce((sum: number, p: any) => {
    const total = totalStockCtn(p);
    return sum + (total * (p.cost_per_ctn || 0));
  }, 0);

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Stock by Location" subtitle="Real-time inventory across all warehouses and branches" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {locations.map(loc => {
          const isWh = loc.type === "WAREHOUSE";
          const ctns = products.reduce((sum: number, p: any) => {
            const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === loc.id);
            return sum + (inventory?.quantity_ctns || 0);
          }, 0);
          
          const val = products.reduce((sum: number, p: any) => {
            const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === loc.id);
            const qty = inventory?.quantity_ctns || 0;
            return sum + (qty * (p.cost_per_ctn || 0));
          }, 0);

          return (
            <Card key={loc.id} className="p-4">
              <div className="text-lg mb-1">{isWh ? "🏭" : "🏪"}</div>
              <div className="text-xs font-semibold" style={{ color: "#1e3a8a" }}>{loc.name}</div>
              <div className="text-xl font-bold font-mono mt-1" style={{ color: "#374151" }}>{ctns}</div>
              <div className="text-xs" style={{ color: "#94a3b8" }}>CTN · {fmt(val)}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "#e2e8f0" }}>
          <div className="font-semibold" style={{ color: "#1e3a8a" }}>Full Stock Matrix</div>
          <div className="text-sm font-mono" style={{ color: "#16a34a" }}>Total: {fmt(totalValue)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider sticky left-0" style={{ color: "#64748b", background: "#f8fafc", minWidth: 180 }}>Product</th>
                {locations.map(l => (
                  <th key={l.id} className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b", background: "#f8fafc" }}>{l.name}</th>
                ))}
                <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Value</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const t = totalStockCtn(p);
                const st = stockStatus(t, p.min_stock || 0);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <div className="font-semibold text-sm" style={{ color: "#1e3a8a" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "#94a3b8" }}>Min: {p.min_stock || 0} CTN</div>
                    </td>
                    {locations.map(l => {
                      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === l.id);
                      const qty = inventory?.quantity_ctns || 0;
                      const lst = stockStatus(qty, p.min_stock || 0);
                      return (
                        <td key={l.id} className="text-center px-3 py-3 font-mono text-sm"
                          style={{ color: lst === "out" ? "#dc2626" : lst === "low" ? "#ca8a04" : "#374151", fontWeight: lst !== "ok" ? 700 : 400 }}>
                          {qty}
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>{t}</td>
                    <td className="text-right px-4 py-3 font-mono text-sm" style={{ color: "#64748b" }}>{fmt(t * (p.cost_per_ctn || 0))}</td>
                    <td className="text-center px-4 py-3"><StatusBadge status={st} /></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f0f4ff" }}>
                <td className="px-4 py-3 font-bold text-xs uppercase" style={{ color: "#1e3a8a" }}>Totals</td>
                {locations.map(l => (
                  <td key={l.id} className="text-center px-3 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                    {products.reduce((sum: number, p: any) => {
                      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === l.id);
                      return sum + (inventory?.quantity_ctns || 0);
                    }, 0)}
                  </td>
                ))}
                <td className="text-center px-3 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                  {products.reduce((sum: number, p: any) => sum + totalStockCtn(p), 0)}
                </td>
                <td className="text-right px-4 py-3 font-mono font-bold" style={{ color: "#16a34a" }}>{fmt(totalValue)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
