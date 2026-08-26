import { PRODUCTS, ALL_LOCATIONS, stockStatus, fmt } from "../../data/mock";
import { Card, PageHeader, StatusBadge, Btn } from "../../components/ui";

export default function LowStock() {
  const alerts = PRODUCTS.flatMap(p =>
    ALL_LOCATIONS.flatMap(loc => {
      const qty = p.stock[loc];
      const st = stockStatus(qty, p.minStock);
      if (st === "ok") return [];
      return [{ product: p, loc, qty, status: st }];
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
              {alerts.map((a, i) => {
                const shortage = Math.max(0, a.product.minStock - a.qty);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm" style={{ color: "#1e3a8a" }}>{a.product.name}</div>
                      <div className="text-xs" style={{ color: "#94a3b8" }}>{a.product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#64748b" }}>{a.product.category}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#374151" }}>{a.loc}</td>
                    <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: a.status === "out" ? "#dc2626" : "#ca8a04" }}>{a.qty}</td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: "#64748b" }}>{a.product.minStock}</td>
                    <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: "#dc2626" }}>
                      {shortage > 0 ? `-${shortage}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Btn small variant="secondary">Request Transfer</Btn>
                    </td>
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
