import { useState, useEffect } from "react";
import { inventoryApi } from "../../utils/api";
import { Card, PageHeader, MovTypeBadge, Th, Td } from "../../components/ui";

type MovementType = "STOCK_RECEIVED" | "WAREHOUSE_TRANSFER" | "BRANCH_TRANSFER" | "SALE" | "ADJUSTMENT" | "RETURN";

const TYPES: MovementType[] = ["STOCK_RECEIVED", "WAREHOUSE_TRANSFER", "BRANCH_TRANSFER", "SALE", "ADJUSTMENT", "RETURN"];

export default function Movements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const movementsData = await inventoryApi.getInventory();
        
        // Filter to only get movements (inventory transactions)
        const filtered = movementsData.filter((m: any) => m.type);
        setMovements(filtered);
        console.log("Movements loaded:", filtered);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch movements:", err);
        setError("Failed to load movement data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading movements...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const filtered = typeFilter === "All" ? movements : movements.filter(m => m.type === typeFilter);

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Stock Movements" subtitle="Append-only inventory transaction ledger" />

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTypeFilter("All")}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{ background: typeFilter === "All" ? "#1e3a8a" : "#f1f5f9", color: typeFilter === "All" ? "#fff" : "#64748b" }}>
          All ({movements.length})
        </button>
        {TYPES.map(t => {
          const count = movements.filter(m => m.type === t).length;
          return (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{ background: typeFilter === t ? "#dbeafe" : "#f1f5f9", color: typeFilter === t ? "#1d4ed8" : "#64748b" }}>
              {t.replace(/_/g, " ")} ({count})
            </button>
          );
        })}
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
              {filtered.length > 0 ? (
                [...filtered].reverse().map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td mono><span style={{ color: "#94a3b8" }}>{m.id?.slice(0, 8) || "—"}</span></Td>
                    <Td mono><span style={{ color: "#64748b" }}>{m.date || "—"}</span></Td>
                    <Td><span className="font-semibold" style={{ color: "#1e3a8a" }}>{m.product_name || "Unknown"}</span></Td>
                    <Td><MovTypeBadge type={m.type} /></Td>
                    <Td>{m.from_location || "—"}</Td>
                    <Td>{m.to_location || "—"}</Td>
                    <Td mono>
                      <span className="font-bold" style={{ color: m.quantity_ctns < 0 ? "#dc2626" : "#16a34a" }}>
                        {m.quantity_ctns > 0 ? `+${m.quantity_ctns}` : m.quantity_ctns}
                      </span>
                    </Td>
                    <Td><span style={{ color: "#94a3b8" }}>{m.user_name || "System"}</span></Td>
                    <Td><span style={{ color: "#94a3b8" }}>{m.notes || "—"}</span></Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={9} style={{ textAlign: "center", color: "#94a3b8" }}>No movements found</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
