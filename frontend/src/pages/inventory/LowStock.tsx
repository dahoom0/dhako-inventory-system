import { useState, useEffect } from "react";
import { productApi, locationApi } from "../../utils/api";
import { Card, PageHeader, StatusBadge, Btn } from "../../components/ui";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const stockStatus = (qty: number, minStock: number) => {
  if (qty === 0) return "out";
  if (qty < minStock) return "low";
  return "ok";
};

export default function LowStock() {
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
        
        console.log("Low stock data:", { products: productsData, locations: locationsData });
        setError(null);
      } catch (err) {
        console.error("Failed to fetch low stock data:", err);
        setError("Failed to load low stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading low stock alerts...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Generate alerts from products and locations
  const alerts = products.flatMap(p =>
    locations.flatMap(loc => {
      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === loc.id);
      const qty = inventory?.quantity_ctns || 0;
      const st = stockStatus(qty, p.min_stock || 0);
      if (st === "ok") return [];
      return [{ product: p, location: loc, qty, status: st }];
    })
  ).sort((a, b) => {
    if (a.status === "out" && b.status !== "out") return -1;
    if (b.status === "out" && a.status !== "out") return 1;
    return a.qty - b.qty;
  });

  const outCount = alerts.filter(a => a.status === "out").length;
  const lowCount = alerts.filter(a => a.status === "low").length;

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Low Stock Alerts" subtitle={`${alerts.length} alerts across all locations`} />

      <div className="grid grid-cols-2 gap-4 mb-5">
        <Card className="p-4 flex items-center gap-4" style={{ border: "1px solid #fecaca" }}>
          <div className="w-2 h-12 rounded-full" style={{ background: "#dc2626" }} />
          <div>
            <div className="text-3xl font-bold font-mono" style={{ color: "#dc2626" }}>{outCount}</div>
            <div className="text-xs" style={{ color: "#94a3b8" }}>Out of Stock locations</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4" style={{ border: "1px solid #fde68a" }}>
          <div className="w-2 h-12 rounded-full" style={{ background: "#ca8a04" }} />
          <div>
            <div className="text-3xl font-bold font-mono" style={{ color: "#ca8a04" }}>{lowCount}</div>
            <div className="text-xs" style={{ color: "#94a3b8" }}>Low Stock locations</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Status", "Product", "Category", "Location", "Current CTN", "Min Stock", "Shortage", "Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.length > 0 ? (
                alerts.map((a, i) => {
                  const shortage = Math.max(0, (a.product.min_stock || 0) - a.qty);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm" style={{ color: "#1e3a8a" }}>{a.product.name}</div>
                        <div className="text-xs" style={{ color: "#94a3b8" }}>{a.product.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#64748b" }}>{a.product.category || "Other"}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#374151" }}>{a.location.name}</td>
                      <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: a.status === "out" ? "#dc2626" : "#ca8a04" }}>{a.qty}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: "#64748b" }}>{a.product.min_stock || 0}</td>
                      <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: "#dc2626" }}>
                        {shortage > 0 ? `-${shortage}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Btn small variant="secondary">Request Transfer</Btn>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>No low stock alerts</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
