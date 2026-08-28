import { Card, PageHeader, Btn, Th, Td } from "../../components/ui";

type Adj = { id: string; date: string; product: string; location: string; before: number; delta: number; after: number; reason: string; user: string; notes: string };
const DATA: Adj[] = [
  { id: "ADJ001", date: "2026-08-25", product: "Biscuits Assorted", location: "Branch 1", before: 5, delta: -1, after: 4, reason: "Damaged", user: "Ali", notes: "Display carton fell and was damaged" },
  { id: "ADJ002", date: "2026-08-20", product: "Mineral Water 600ml", location: "Branch 1", before: 6, delta: -1, after: 5, reason: "Incorrect Count", user: "Ali", notes: "Annual stocktake correction" },
  { id: "ADJ003", date: "2026-08-18", product: "Coca Cola 330ml", location: "Branch 3", before: 7, delta: 1, after: 8, reason: "Returned", user: "Siti", notes: "Customer return, restocked after inspection" },
  { id: "ADJ004", date: "2026-08-15", product: "Orange Juice 1L", location: "Warehouse C", before: 62, delta: -2, after: 60, reason: "Expired", user: "Yusuf", notes: "2 CTN expired before sale" },
];

const REASON_COLORS: Record<string, string> = {
  Damaged: "#dc2626", Broken: "#dc2626", Lost: "#ca8a04",
  "Incorrect Count": "#1d4ed8", Returned: "#16a34a", Expired: "#7c3aed",
  "Manual Correction": "#64748b", Other: "#94a3b8",
};

export default function Adjustments() {
  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Stock Adjustments" subtitle="Damage, loss, corrections — every change requires a reason" action={<Btn>+ New Adjustment</Btn>} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["ID", "Date", "Product", "Location", "Before", "Change", "After", "Reason", "User", "Notes"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {DATA.map(a => {
                const c = REASON_COLORS[a.reason] || "#94a3b8";
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td mono><span style={{ color: "#94a3b8" }}>{a.id}</span></Td>
                    <Td mono><span style={{ color: "#64748b" }}>{a.date}</span></Td>
                    <Td><span className="font-semibold" style={{ color: "#1e3a8a" }}>{a.product}</span></Td>
                    <Td>{a.location}</Td>
                    <Td mono>{a.before} CTN</Td>
                    <Td mono>
                      <span className="font-bold" style={{ color: a.delta < 0 ? "#dc2626" : "#16a34a" }}>
                        {a.delta > 0 ? `+${a.delta}` : a.delta}
                      </span>
                    </Td>
                    <Td mono><span className="font-bold">{a.after} CTN</span></Td>
                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: `${c}18`, color: c }}>
                        {a.reason}
                      </span>
                    </Td>
                    <Td><span style={{ color: "#94a3b8" }}>{a.user}</span></Td>
                    <Td><span className="text-xs" style={{ color: "#94a3b8" }}>{a.notes}</span></Td>
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
