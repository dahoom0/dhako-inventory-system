import React, { useState, FormEvent } from "react";
import { Card, Btn, Th, Td } from "@/components/ui";

interface DamageRecord {
  id: string;
  product: string;
  quantity: number;
  reason: string;
  date: string;
  reportedBy: string;
}

interface Props {
  branchName: string;
  onBack: () => void;
}

const RecordDamage: React.FC<Props> = ({ branchName, onBack }) => {
  const [showForm, setShowForm] = useState(false);
  const [damages, setDamages] = useState<DamageRecord[]>([
    {
      id: "D001",
      product: "Coca Cola 330ml",
      quantity: 5,
      reason: "Broken bottles during delivery",
      date: "2026-08-24",
      reportedBy: "Ahmed",
    },
  ]);
  const [formData, setFormData] = useState({
    product: "Coca Cola 330ml",
    quantity: "",
    reason: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newDamage: DamageRecord = {
      id: `D${Date.now()}`,
      product: formData.product,
      quantity: parseInt(formData.quantity),
      reason: formData.reason,
      date: new Date().toISOString().split("T")[0],
      reportedBy: "Current User",
    };
    setDamages([newDamage, ...damages]);
    setFormData({ product: "Coca Cola 330ml", quantity: "", reason: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Btn onClick={onBack} variant="secondary">
          ← Back
        </Btn>
        <h2 className="text-2xl font-bold">Jaajab (Damaged/Lost Items)</h2>
      </div>

      {!showForm ? (
        <Btn onClick={() => setShowForm(true)} variant="primary">
          + Report Damage (Jaajab Cusub)
        </Btn>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Report Damaged or Lost Items</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Which Item?</label>
                <select
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option>Coca Cola 330ml</option>
                  <option>Mineral Water 600ml</option>
                  <option>Orange Juice 1L</option>
                  <option>Instant Noodles</option>
                  <option>Biscuits Assorted</option>
                  <option>Cooking Oil 1L</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">How Many?</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Number of damaged items"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">What Happened? (Waa maxay sababta?)</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Choose reason...</option>
                  <option value="Broken bottles during delivery">Broken bottles during delivery</option>
                  <option value="Damaged packaging">Damaged packaging</option>
                  <option value="Expired/Out of date">Expired/Out of date</option>
                  <option value="Lost in storage">Lost in storage</option>
                  <option value="Water/Fire damage">Water/Fire damage</option>
                  <option value="Spillage">Spillage</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary">
                Report Damage
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Damage History */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Damage Reports (Jaajabka Hadii Jira)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <Th>Product</Th>
                <Th className="text-center">Qty</Th>
                <Th>Reason</Th>
                <Th>Date</Th>
                <Th>Reported By</Th>
              </tr>
            </thead>
            <tbody>
              {damages.map((damage) => (
                <tr key={damage.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <Td>
                    <span className="font-semibold">{damage.product}</span>
                  </Td>
                  <Td className="text-center font-bold" style={{ color: "#dc2626" }}>
                    {damage.quantity}
                  </Td>
                  <Td className="text-sm">{damage.reason}</Td>
                  <Td style={{ color: "#64748b" }}>{damage.date}</Td>
                  <Td style={{ color: "#64748b" }}>{damage.reportedBy}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RecordDamage;
