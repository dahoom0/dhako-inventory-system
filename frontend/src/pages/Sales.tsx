import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { SALES, PRODUCTS, fmt, saleRevenue, saleProfit, type Sale } from "../data/mock";
import { Card, PageHeader, Btn, Th, Td } from "../components/ui";

export default function Sales() {
  const { user, getAccessibleLocations } = useAuth();
  
  // Only ADMIN can access Sales
  if (user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#dc2626", fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Access Denied</div>
          <div style={{ color: "#64748b" }}>Only administrators can view sales records.</div>
        </Card>
      </div>
    );
  }

  const [sales, setSales] = useState<Sale[]>(SALES);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [form, setForm] = useState({ productId: "", ctns: 1, branch: "Branch 1" as Sale["branch"], customer: "", date: "2026-08-25" });

  const totalRev = sales.reduce((s, x) => s + saleRevenue(x), 0);
  const totalPro = sales.reduce((s, x) => s + saleProfit(x), 0);

  const filtered = sales.filter(s =>
    (branchFilter === "All" || s.branch === branchFilter) &&
    (s.product.toLowerCase().includes(search.toLowerCase()) || s.customer.toLowerCase().includes(search.toLowerCase()))
  );

  function handleSubmit() {
    const p = PRODUCTS.find(x => x.id === form.productId);
    if (!p) return;
    const ns: Sale = {
      id: `S${String(sales.length + 1).padStart(3, "0")}`,
      date: form.date, branch: form.branch, product: p.name, productId: p.id,
      ctns: form.ctns, unitType: "CTN", sellPrice: p.sellPerCtn, costPrice: p.costPerCtn,
      customer: form.customer || "Walk-in", user: "Ahmed",
    };
    setSales([...sales, ns]);
    setShowModal(false);
    setForm({ productId: "", ctns: 1, branch: "Branch 1", customer: "", date: "2026-08-25" });
  }

  const selProd = PRODUCTS.find(p => p.id === form.productId);

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Sales"
        subtitle={`${sales.length} transactions · ${fmt(totalRev)} revenue`}
        action={<Btn onClick={() => setShowModal(true)}>+ Record Sale</Btn>}
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total Revenue", value: fmt(totalRev), color: "#1e3a8a" },
          { label: "Gross Profit", value: fmt(totalPro), color: "#16a34a" },
          { label: "Avg Margin", value: `${((totalPro / totalRev) * 100).toFixed(1)}%`, color: "#2563eb" },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>{c.label}</div>
            <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 flex flex-wrap gap-3 border-b" style={{ borderColor: "#e2e8f0" }}>
          <input
            type="text" placeholder="Search product or customer…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm"
            style={{ border: "1px solid #e2e8f0", outline: "none", color: "#374151" }}
          />
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
            {["All", "Branch 1", "Branch 2", "Branch 3"].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["ID", "Date", "Product", "CTNs", "Unit Price", "Revenue", "Profit", "Branch", "Customer", "User"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <Td mono><span style={{ color: "#94a3b8" }}>{s.id}</span></Td>
                  <Td mono><span style={{ color: "#64748b" }}>{s.date}</span></Td>
                  <Td><span className="font-medium" style={{ color: "#1e3a8a" }}>{s.product}</span></Td>
                  <Td mono>{s.ctns}</Td>
                  <Td mono>{fmt(s.sellPrice)}</Td>
                  <Td mono><span className="font-semibold">{fmt(saleRevenue(s))}</span></Td>
                  <Td mono><span className="font-semibold" style={{ color: "#16a34a" }}>{fmt(saleProfit(s))}</span></Td>
                  <Td>{s.branch}</Td>
                  <Td>{s.customer}</Td>
                  <Td><span style={{ color: "#94a3b8" }}>{s.user}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-5" style={{ color: "#1e3a8a" }}>Record Sale</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Product</label>
                <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
                  <option value="">Select product…</option>
                  {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Cartons (CTN)</label>
                  <input type="number" min={1} value={form.ctns}
                    onChange={e => setForm(f => ({ ...f, ctns: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Branch</label>
                  <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value as Sale["branch"] }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }}>
                    {["Branch 1", "Branch 2", "Branch 3"].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Customer</label>
                <input type="text" placeholder="Walk-in" value={form.customer}
                  onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid #e2e8f0", color: "#374151" }} />
              </div>
              {selProd && (
                <div className="rounded-xl p-4 text-xs space-y-2" style={{ background: "#f0f4ff" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Price/CTN</span>
                    <span className="font-mono font-semibold">{fmt(selProd.sellPerCtn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Qty/CTN</span>
                    <span className="font-mono">{selProd.qtyPerCtn} {selProd.unit}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Total Revenue</span>
                    <span className="font-mono font-bold" style={{ color: "#1e3a8a" }}>{fmt(form.ctns * selProd.sellPerCtn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Gross Profit</span>
                    <span className="font-mono font-bold" style={{ color: "#16a34a" }}>{fmt(form.ctns * (selProd.sellPerCtn - selProd.costPerCtn))}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <button
                onClick={handleSubmit}
                disabled={!form.productId}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{ background: "#1e3a8a", color: "#fff" }}
              >Record Sale</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
