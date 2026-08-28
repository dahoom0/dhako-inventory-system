import { useState } from "react";
import { MOVEMENTS, type StockMovement } from "../../data/mock";
import { Card, PageHeader, MovTypeBadge, Th, Td } from "../../components/ui";

const TYPES: StockMovement["type"][] = ["STOCK_RECEIVED", "WAREHOUSE_TRANSFER", "BRANCH_TRANSFER", "SALE", "ADJUSTMENT", "RETURN"];

export default function Movements() {
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = typeFilter === "All" ? MOVEMENTS : MOVEMENTS.filter(m => m.type === typeFilter);

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Stock Movements" subtitle="Append-only inventory transaction ledger" />

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTypeFilter("All")}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{ background: typeFilter === "All" ? "#1e3a8a" : "#f1f5f9", color: typeFilter === "All" ? "#fff" : "#64748b" }}>
          All ({MOVEMENTS.length})
        </button>
        {TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{ background: typeFilter === t ? "#dbeafe" : "#f1f5f9", color: typeFilter === t ? "#1d4ed8" : "#64748b" }}>
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["TXN ID", "Date", "Product", "Type", "From", "To", "CTNs", "User", "Note"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <Td mono><span style={{ color: "#94a3b8" }}>{m.id}</span></Td>
                  <Td mono><span style={{ color: "#64748b" }}>{m.date}</span></Td>
                  <Td><span className="font-semibold" style={{ color: "#1e3a8a" }}>{m.product}</span></Td>
                  <Td><MovTypeBadge type={m.type} /></Td>
                  <Td>{m.from}</Td>
                  <Td>{m.to}</Td>
                  <Td mono>
                    <span className="font-bold" style={{ color: m.ctns < 0 ? "#dc2626" : "#16a34a" }}>
                      {m.ctns > 0 ? `+${m.ctns}` : m.ctns}
                    </span>
                  </Td>
                  <Td><span style={{ color: "#94a3b8" }}>{m.user}</span></Td>
                  <Td><span style={{ color: "#94a3b8" }}>{m.note || "—"}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
