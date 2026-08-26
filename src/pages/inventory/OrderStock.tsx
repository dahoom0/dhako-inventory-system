import React, { useState, FormEvent } from "react";
import { useLocations } from "@/context/LocationContext";
import { Card, Btn, Th, Td } from "@/components/ui";

interface OrderItem {
  id: string;
  product: string;
  quantity: number;
  from: string;
  to: string;
  date: string;
  status: "Pending" | "Approved" | "Sent" | "Received";
}

interface Props {
  branchName: string;
  onBack: () => void;
}

const OrderStock: React.FC<Props> = ({ branchName, onBack }) => {
  const { locations, getLocationName } = useLocations();
  const [showForm, setShowForm] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: "O001",
      product: "Coca Cola 330ml",
      quantity: 100,
      from: "w1",
      to: branchName,
      date: "2026-08-25",
      status: "Pending",
    },
  ]);
  const [formData, setFormData] = useState({
    product: "Coca Cola 330ml",
    quantity: "",
    from: "w1",
  });

  const warehouses = locations.filter((loc) => loc.type === "WAREHOUSE");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newOrder: OrderItem = {
      id: `O${Date.now()}`,
      product: formData.product,
      quantity: parseInt(formData.quantity),
      from: formData.from,
      to: branchName,
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
    };
    setOrders([newOrder, ...orders]);
    setFormData({ product: "Coca Cola 330ml", quantity: "", from: warehouses[0]?.id || "w1" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Btn onClick={onBack} variant="secondary">
          ← Back
        </Btn>
        <h2 className="text-2xl font-bold">Dalab (Order Stock)</h2>
      </div>

      {!showForm ? (
        <Btn onClick={() => setShowForm(true)} variant="primary">
          + New Order (Dalab Cusub)
        </Btn>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Request Stock from Warehouse</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Which Warehouse?</label>
                <select
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

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
                <label className="block font-semibold mb-2">How Many Cartoons?</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Enter number of cartoons"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary">
                Send Order
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Orders History */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Your Orders (Daladka Ku Jira)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <Th>Item</Th>
                <Th className="text-center">Qty</Th>
                <Th>From</Th>
                <Th>Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <Td>
                    <span className="font-semibold">{order.product}</span>
                  </Td>
                  <Td className="text-center font-bold">{order.quantity} CTN</Td>
                  <Td>{getLocationName(order.from)}</Td>
                  <Td style={{ color: "#64748b" }}>{order.date}</Td>
                  <Td>
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{
                        background: order.status === "Pending" ? "#fef9c3" : "#dcfce7",
                        color: order.status === "Pending" ? "#ca8a04" : "#16a34a",
                      }}
                    >
                      {order.status}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OrderStock;
