import { PRODUCTS, ALL_LOCATIONS, WAREHOUSES, BRANCHES, totalStockCtn, stockStatus, inventoryValue, fmt } from "../../data/mock";
import { Card, PageHeader, StatusBadge } from "../../components/ui";

export default function StockByLocation() {
  const totalValue = inventoryValue(PRODUCTS);

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Stock by Location" subtitle="Real-time inventory across all warehouses and branches" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {ALL_LOCATIONS.map(loc => {
          const isWh = (WAREHOUSES as readonly string[]).includes(loc);
          const ctns = PRODUCTS.reduce((s, p) => s + p.stock[loc], 0);
          const val = PRODUCTS.reduce((s, p) => s + p.stock[loc] * p.costPerCtn, 0);
          return (
            <Card key={loc} className="p-4">
              <div className="text-lg mb-1">{isWh ? "🏭" : "🏪"}</div>
              <div className="text-xs font-semibold" style={{ color: "#1e3a8a" }}>{loc}</div>
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
                {ALL_LOCATIONS.map(l => (
                  <th key={l} className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b", background: "#f8fafc" }}>{l}</th>
                ))}
                <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Value</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b", background: "#f8fafc" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map(p => {
                const t = totalStockCtn(p);
                const st = stockStatus(t, p.minStock);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <div className="font-semibold text-sm" style={{ color: "#1e3a8a" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "#94a3b8" }}>Min: {p.minStock} CTN</div>
                    </td>
                    {ALL_LOCATIONS.map(l => {
                      const qty = p.stock[l];
                      const lst = stockStatus(qty, p.minStock);
                      return (
                        <td key={l} className="text-center px-3 py-3 font-mono text-sm"
                          style={{ color: lst === "out" ? "#dc2626" : lst === "low" ? "#ca8a04" : "#374151", fontWeight: lst !== "ok" ? 700 : 400 }}>
                          {qty}
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>{t}</td>
                    <td className="text-right px-4 py-3 font-mono text-sm" style={{ color: "#64748b" }}>{fmt(t * p.costPerCtn)}</td>
                    <td className="text-center px-4 py-3"><StatusBadge status={st} /></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f0f4ff" }}>
                <td className="px-4 py-3 font-bold text-xs uppercase" style={{ color: "#1e3a8a" }}>Totals</td>
                {ALL_LOCATIONS.map(l => (
                  <td key={l} className="text-center px-3 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                    {PRODUCTS.reduce((s, p) => s + p.stock[l], 0)}
                  </td>
                ))}
                <td className="text-center px-3 py-3 font-mono font-bold" style={{ color: "#1e3a8a" }}>
                  {PRODUCTS.reduce((s, p) => s + totalStockCtn(p), 0)}
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
