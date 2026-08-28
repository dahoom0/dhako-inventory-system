import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TRANSFERS, type Transfer } from "../../data/mock";
import { Card, PageHeader, Btn, Th, Td } from "../../components/ui";

const STATUS_STYLE: Record<Transfer["status"], { bg: string; text: string }> = {
  Pending:   { bg: "#fef9c3", text: "#ca8a04" },
  Approved:  { bg: "#dbeafe", text: "#1d4ed8" },
  Sent:      { bg: "#ede9fe", text: "#7c3aed" },
  Received:  { bg: "#dcfce7", text: "#16a34a" },
  Cancelled: { bg: "#fee2e2", text: "#dc2626" },
};

export default function Transfers() {
  const { user, getAccessibleLocations } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>(TRANSFERS);

  // Filter transfers by user's accessible locations
  const accessibleLocations = getAccessibleLocations();
  const filteredTransfers = transfers.filter((t) => {
    // Map location names to IDs
    const locationMap: Record<string, string> = {
      "Warehouse A": "w1",
      "Warehouse B": "w2",
      "Warehouse C": "w3",
      "Branch Mogadishu": "b1",
      "Branch Hargeisa": "b2",
      "Branch Kismayo": "b3",
    };

    const fromId = locationMap[t.from];
    const toId = locationMap[t.to];

    // Show transfer if user can access either from or to location
    return (fromId && accessibleLocations.includes(fromId)) || (toId && accessibleLocations.includes(toId));
  });

  function advance(id: string) {
    const order: Transfer["status"][] = ["Pending", "Approved", "Sent", "Received"];
    setTransfers(ts => ts.map(t => {
      if (t.id !== id) return t;
      const idx = order.indexOf(t.status);
      return idx < order.length - 1 ? { ...t, status: order[idx + 1] } : t;
    }));
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Transfers" subtitle="Stock movements between warehouses and branches" action={<Btn>+ New Transfer</Btn>} />

      <div className="flex gap-3 flex-wrap mb-4">
        {(["Pending", "Approved", "Sent", "Received", "Cancelled"] as Transfer["status"][]).map(st => {
          const count = filteredTransfers.filter(t => t.status === st).length;
          const s = STATUS_STYLE[st];
          return (
            <div key={st} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.text }}>
              {count} {st}
            </div>
          );
        })}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["ID", "Date", "Product", "From", "To", "CTNs", "Status", "Requested By", "Action"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {[...filteredTransfers].reverse().map(t => {
                const s = STATUS_STYLE[t.status];
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td mono><span style={{ color: "#94a3b8" }}>{t.id}</span></Td>
                    <Td mono><span style={{ color: "#64748b" }}>{t.date}</span></Td>
                    <Td><span className="font-semibold" style={{ color: "#1e3a8a" }}>{t.product}</span></Td>
                    <Td>{t.from}</Td>
                    <Td>{t.to}</Td>
                    <Td mono><span className="font-bold">{t.qty}</span></Td>
                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.text }}>
                        {t.status}
                      </span>
                    </Td>
                    <Td><span style={{ color: "#94a3b8" }}>{t.requestedBy}</span></Td>
                    <Td>
                      {t.status !== "Received" && t.status !== "Cancelled" && (
                        <button onClick={() => advance(t.id)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                          Advance →
                        </button>
                      )}
                    </Td>
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
