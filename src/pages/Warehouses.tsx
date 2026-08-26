import { PRODUCTS, WAREHOUSES, totalStockCtn, stockStatus, inventoryValue, fmt } from "../data/mock";
import { Card, PageHeader, StatusBadge } from "../components/ui";

export default function Warehouses() {
  const whStats = WAREHOUSES.map(wh => ({
    wh,
    totalCtns: PRODUCTS.reduce((s, p) => s + p.stock[wh], 0),
    value: PRODUCTS.reduce((s, p) => s + p.stock[wh] * p.costPerCtn, 0),
    lowItems: PRODUCTS.filter(p => stockStatus(p.stock[wh], p.minStock) !== "ok").length,
  }));

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Warehouses" subtitle="Central warehouse inventory overview" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {whStats.map(w => (
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
                {WAREHOUSES.map(w => (
                  <th key={w} className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>{w}</th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>WH Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map(p => {
                const whTotal = WAREHOUSES.reduce((s, w) => s + p.stock[w], 0);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: "#1e3a8a" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "#94a3b8" }}>{p.sku} · {p.qtyPerCtn} {p.unit}s/CTN</div>
                    </td>
                    {WAREHOUSES.map(w => {
                      const qty = p.stock[w];
                      const st = stockStatus(qty, p.minStock);
                      return (
                        <td key={w} className="text-center px-4 py-3 font-mono font-semibold" style={{ color: st === "out" ? "#dc2626" : st === "low" ? "#ca8a04" : "#374151" }}>
                          {qty} CTN
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>{whTotal}</td>
                    <td className="text-right px-4 py-3 font-mono" style={{ color: "#64748b" }}>{fmt(whTotal * p.costPerCtn)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f0f4ff" }}>
                <td className="px-4 py-3 font-bold text-xs uppercase" style={{ color: "#1e3a8a" }}>Totals</td>
                {WAREHOUSES.map(w => (
                  <td key={w} className="text-center px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                    {PRODUCTS.reduce((s, p) => s + p.stock[w], 0)}
                  </td>
                ))}
                <td className="text-center px-4 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                  {PRODUCTS.reduce((s, p) => s + WAREHOUSES.reduce((x, w) => x + p.stock[w], 0), 0)}
                </td>
                <td className="text-right px-4 py-3 font-mono font-bold" style={{ color: "#16a34a" }}>
                  {fmt(PRODUCTS.reduce((s, p) => s + WAREHOUSES.reduce((x, w) => x + p.stock[w], 0) * p.costPerCtn, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
