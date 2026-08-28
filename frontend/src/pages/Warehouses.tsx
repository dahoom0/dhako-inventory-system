import { useState, useEffect } from "react";
import { productApi, locationApi } from "../utils/api";
import { Card, PageHeader, StatusBadge } from "../components/ui";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const stockStatus = (qty: number, minStock: number) => {
  if (qty === 0) return "out";
  if (qty < minStock) return "low";
  return "ok";
};

export default function Warehouses() {
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
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
        
        // Filter warehouses only
        const warehouseLocations = locationsData.filter((loc: any) => loc.type === "WAREHOUSE");
        setWarehouses(warehouseLocations);
        
        console.log("Warehouses data:", { products: productsData, locations: locationsData });
        setError(null);
      } catch (err) {
        console.error("Failed to fetch warehouse data:", err);
        setError("Failed to load warehouse data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading warehouse data...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Calculate warehouse statistics from inventory data
  const whStats = warehouses.map((wh: any) => {
    const totalCtns = products.reduce((sum: number, p: any) => {
      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === wh.id);
      return sum + (inventory?.quantity_ctns || 0);
    }, 0);
    
    const value = products.reduce((sum: number, p: any) => {
      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === wh.id);
      const qty = inventory?.quantity_ctns || 0;
      return sum + (qty * (p.cost_per_ctn || 0));
    }, 0);
    
    const lowItems = products.filter((p: any) => {
      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === wh.id);
      const qty = inventory?.quantity_ctns || 0;
      return stockStatus(qty, p.min_stock || 0) !== "ok";
    }).length;

    return { wh: wh.name, totalCtns, value, lowItems };
  });

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Warehouses" subtitle="Central warehouse inventory overview" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {whStats.map((w: any) => (
          <Card key={w.wh} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "#dbeafe" }}>🏭</div>
              <div>
                <div className="font-bold" style={{ color: "#1e3a8a" }}>{w.wh}</div>
                <div className="text-xs" style={{ color: "#94a3b8" }}>Central warehouse</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              <div>
                <div className="font-bold text-lg font-mono" style={{ color: "#1e3a8a" }}>{w.totalCtns}</div>
                <div style={{ color: "#94a3b8" }}>Total CTN</div>
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: "#16a34a" }}>{fmt(w.value)}</div>
                <div style={{ color: "#94a3b8" }}>Value</div>
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: w.lowItems > 0 ? "#dc2626" : "#16a34a" }}>{w.lowItems}</div>
                <div style={{ color: "#94a3b8" }}>Alerts</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b font-semibold" style={{ borderColor: "#e2e8f0", color: "#1e3a8a" }}>
          Stock by Product across Warehouses
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Product</th>
                {warehouses.map((w: any) => (
                  <th key={w.id} className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>{w.name}</th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>WH Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const whTotal = warehouses.reduce((sum: number, w: any) => {
                  const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === w.id);
                  return sum + (inventory?.quantity_ctns || 0);
                }, 0);
                
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: "#1e3a8a" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "#94a3b8" }}>{p.sku} · {p.qty_per_ctn} units/CTN</div>
                    </td>
                    {warehouses.map((w: any) => {
                      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === w.id);
                      const qty = inventory?.quantity_ctns || 0;
                      const st = stockStatus(qty, p.min_stock || 0);
                      return (
                        <td key={w.id} className="text-center px-4 py-3 font-mono font-semibold" style={{ color: st === "out" ? "#dc2626" : st === "low" ? "#ca8a04" : "#374151" }}>
                          {qty} CTN
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>{whTotal}</td>
                    <td className="text-right px-4 py-3 font-mono" style={{ color: "#64748b" }}>{fmt(whTotal * (p.cost_per_ctn || 0))}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f0f4ff" }}>
                <td className="px-4 py-3 font-bold text-xs uppercase" style={{ color: "#1e3a8a" }}>Totals</td>
                {warehouses.map((w: any) => (
                  <td key={w.id} className="text-center px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                    {products.reduce((sum: number, p: any) => {
                      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === w.id);
                      return sum + (inventory?.quantity_ctns || 0);
                    }, 0)}
                  </td>
                ))}
                <td className="text-center px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                  {products.reduce((sum: number, p: any) => {
                    const total = warehouses.reduce((s: number, w: any) => {
                      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === w.id);
                      return s + (inventory?.quantity_ctns || 0);
                    }, 0);
                    return sum + total;
                  }, 0)}
                </td>
                <td className="text-right px-4 py-3 font-mono font-bold" style={{ color: "#16a34a" }}>
                  {fmt(products.reduce((sum: number, p: any) => {
                    const total = warehouses.reduce((s: number, w: any) => {
                      const inventory = p.inventory_by_location?.find((inv: any) => inv.location_id === w.id);
                      return s + (inventory?.quantity_ctns || 0);
                    }, 0);
                    return sum + (total * (p.cost_per_ctn || 0));
                  }, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
