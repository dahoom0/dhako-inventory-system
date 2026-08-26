import React, { useState, useEffect, FormEvent } from "react";
import { PageHeader, Btn, Card, StatusBadge } from "@/components/ui";

interface TransferItem {
  productId: string;
  productName: string;
  qtyCtn: number;
}

interface BranchTransfer {
  id: string;
  warehouse: string;
  branch: string;
  status: "PENDING" | "APPROVED" | "SENT" | "RECEIVED" | "CANCELLED";
  itemCount: number;
  createdBy: string;
  createdDate: string;
  items?: TransferItem[];
}

const WAREHOUSES = [
  { id: "w1", name: "Warehouse A" },
  { id: "w2", name: "Warehouse B" },
  { id: "w3", name: "Warehouse C" },
];

const BRANCHES = [
  { id: "b1", name: "Branch Mogadishu" },
  { id: "b2", name: "Branch Hargeisa" },
  { id: "b3", name: "Branch Kismayo" },
];

const PRODUCTS = [
  { id: "P001", name: "Coca Cola 330ml" },
  { id: "P002", name: "Mineral Water 600ml" },
  { id: "P003", name: "Orange Juice 1L" },
  { id: "P004", name: "Instant Noodles" },
  { id: "P005", name: "Biscuits Assorted" },
  { id: "P006", name: "Cooking Oil 1L" },
];

interface FormData {
  fromWarehouse: string;
  toBranch: string;
  items: Array<{ productId: string; qtyCtn: string }>;
}

const BranchTransfers: React.FC = () => {
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<BranchTransfer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fromWarehouse: "w1",
    toBranch: "b1",
    items: [{ productId: "P001", qtyCtn: "" }],
  });

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setIsLoading(true);
      // Mock data
      const mockTransfers: BranchTransfer[] = [
        {
          id: "BT001",
          warehouse: "Warehouse A",
          branch: "Branch Mogadishu",
          status: "RECEIVED",
          itemCount: 2,
          createdBy: "Ahmed",
          createdDate: "2026-08-25",
          items: [
            { productId: "P001", productName: "Coca Cola 330ml", qtyCtn: 50 },
            { productId: "P004", productName: "Instant Noodles", qtyCtn: 30 },
          ],
        },
        {
          id: "BT002",
          warehouse: "Warehouse B",
          branch: "Branch Hargeisa",
          status: "SENT",
          itemCount: 1,
          createdBy: "Yusuf",
          createdDate: "2026-08-24",
          items: [{ productId: "P002", productName: "Mineral Water 600ml", qtyCtn: 40 }],
        },
        {
          id: "BT003",
          warehouse: "Warehouse A",
          branch: "Branch Kismayo",
          status: "APPROVED",
          itemCount: 3,
          createdBy: "Fatima",
          createdDate: "2026-08-23",
          items: [
            { productId: "P003", productName: "Orange Juice 1L", qtyCtn: 20 },
            { productId: "P005", productName: "Biscuits Assorted", qtyCtn: 25 },
            { productId: "P006", productName: "Cooking Oil 1L", qtyCtn: 15 },
          ],
        },
        {
          id: "BT004",
          warehouse: "Warehouse C",
          branch: "Branch Mogadishu",
          status: "PENDING",
          itemCount: 2,
          createdBy: "Ali",
          createdDate: "2026-08-22",
          items: [
            { productId: "P001", productName: "Coca Cola 330ml", qtyCtn: 35 },
            { productId: "P002", productName: "Mineral Water 600ml", qtyCtn: 20 },
          ],
        },
      ];
      setTransfers(mockTransfers);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      setFormError("Failed to load transfers");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "SENT":
        return "bg-purple-100 text-purple-800";
      case "RECEIVED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case "PENDING":
        return { action: "APPROVE", label: "Approve" };
      case "APPROVED":
        return { action: "SEND", label: "Mark as Sent" };
      case "SENT":
        return { action: "RECEIVE", label: "Mark as Received" };
      default:
        return null;
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "P001", qtyCtn: "" }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (formData.items.some((item) => !item.qtyCtn || parseInt(item.qtyCtn) <= 0)) {
      setFormError("All items must have quantity > 0");
      return;
    }

    try {
      const fromWarehouse = WAREHOUSES.find((w) => w.id === formData.fromWarehouse);
      const toBranch = BRANCHES.find((b) => b.id === formData.toBranch);

      const newTransfer: BranchTransfer = {
        id: `BT${Date.now()}`,
        warehouse: fromWarehouse?.name || "Unknown",
        branch: toBranch?.name || "Unknown",
        status: "PENDING",
        itemCount: formData.items.length,
        createdBy: "Current User",
        createdDate: new Date().toISOString().split("T")[0],
        items: formData.items.map((item) => ({
          productId: item.productId,
          productName: PRODUCTS.find((p) => p.id === item.productId)?.name || "Unknown",
          qtyCtn: parseInt(item.qtyCtn),
        })),
      };

      setTransfers([newTransfer, ...transfers]);
      setSuccessMessage(
        `✓ Branch transfer created from ${fromWarehouse?.name} to ${toBranch?.name}`
      );

      setFormData({
        fromWarehouse: "w1",
        toBranch: "b1",
        items: [{ productId: "P001", qtyCtn: "" }],
      });

      setShowForm(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create transfer");
    }
  };

  const handleAdvanceStatus = async (transfer: BranchTransfer, action: string) => {
    try {
      const newStatus =
        action === "APPROVE"
          ? "APPROVED"
          : action === "SEND"
            ? "SENT"
            : action === "RECEIVE"
              ? "RECEIVED"
              : transfer.status;

      setTransfers(
        transfers.map((t) => (t.id === transfer.id ? { ...t, status: newStatus as any } : t))
      );

      setSuccessMessage(`✓ Branch transfer ${action.toLowerCase()} successful`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to update transfer");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      fromWarehouse: "w1",
      toBranch: "b1",
      items: [{ productId: "P001", qtyCtn: "" }],
    });
    setFormError("");
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Branch Stock Transfers"
        subtitle="Manage transfers from warehouses to branches"
        action={
          !showForm && (
            <Btn onClick={() => setShowForm(true)} variant="primary">
              + New Transfer
            </Btn>
          )
        }
      />

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {formError}
        </div>
      )}

      {/* Transfer Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Branch Transfer</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Warehouse
                </label>
                <select
                  name="fromWarehouse"
                  value={formData.fromWarehouse}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WAREHOUSES.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Branch
                </label>
                <select
                  name="toBranch"
                  value={formData.toBranch}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BRANCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Transfer Items</h4>
                <Btn
                  type="button"
                  variant="secondary"
                  small
                  onClick={addItem}
                >
                  + Add Item
                </Btn>
              </div>

              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {PRODUCTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.qtyCtn}
                      onChange={(e) => handleItemChange(index, "qtyCtn", e.target.value)}
                      placeholder="CTN"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      min="1"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary">
                Create Transfer
              </Btn>
              <Btn type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Transfers List */}
      <div className="space-y-4">
        {transfers.map((transfer) => {
          const nextAction = getNextAction(transfer.status);

          return (
            <Card key={transfer.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {transfer.warehouse} → {transfer.branch}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        transfer.status
                      )}`}
                    >
                      {transfer.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {transfer.itemCount} item{transfer.itemCount !== 1 ? "s" : ""} • Created by{" "}
                    {transfer.createdBy} on {transfer.createdDate}
                  </p>
                </div>

                {nextAction && (
                  <Btn
                    variant="primary"
                    small
                    onClick={() => handleAdvanceStatus(transfer, nextAction.action)}
                  >
                    {nextAction.label}
                  </Btn>
                )}
              </div>

              {transfer.items && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Items:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {transfer.items.map((item) => (
                      <li key={item.productId}>
                        • {item.productName} - {item.qtyCtn} CTN
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BranchTransfers;
