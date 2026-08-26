import React, { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Btn, Card } from "@/components/ui";

interface ReceivingRecord {
  id: string;
  productName: string;
  warehouseName: string;
  qtyCtn: number;
  costPerCtn: number;
  totalCost: number;
  date: string;
  user: string;
  supplier?: string;
  notes?: string;
}

interface FormData {
  productId: string;
  warehouseId: string;
  qtyCtn: string;
  costPerCtn: string;
  supplier: string;
  notes: string;
}

const PRODUCTS = [
  { id: "P001", name: "Coca Cola 330ml" },
  { id: "P002", name: "Mineral Water 600ml" },
  { id: "P003", name: "Orange Juice 1L" },
  { id: "P004", name: "Instant Noodles" },
  { id: "P005", name: "Biscuits Assorted" },
  { id: "P006", name: "Cooking Oil 1L" },
];

const WAREHOUSES = [
  { id: "w1", name: "Warehouse A" },
  { id: "w2", name: "Warehouse B" },
  { id: "w3", name: "Warehouse C" },
];

const Receiving: React.FC = () => {
  const { user, getAccessibleLocations } = useAuth();
  const [records, setRecords] = useState<ReceivingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<FormData>({
    productId: "P001",
    warehouseId: "w1",
    qtyCtn: "",
    costPerCtn: "",
    supplier: "",
    notes: "",
  });

  useEffect(() => {
    fetchReceivingHistory();
  }, []);

  const fetchReceivingHistory = async () => {
    try {
      setIsLoading(true);
      // Mock data
      const mockRecords: ReceivingRecord[] = [
        {
          id: "R001",
          productName: "Coca Cola 330ml",
          warehouseName: "Warehouse A",
          qtyCtn: 100,
          costPerCtn: 22,
          totalCost: 2200,
          date: "2026-08-25",
          user: "Ahmed",
          supplier: "Global Beverages Ltd",
          notes: "Regular delivery",
        },
        {
          id: "R002",
          productName: "Mineral Water 600ml",
          warehouseName: "Warehouse B",
          qtyCtn: 80,
          costPerCtn: 12,
          totalCost: 960,
          date: "2026-08-24",
          user: "Yusuf",
          supplier: "Pure Water Corp",
          notes: "Bulk order",
        },
        {
          id: "R003",
          productName: "Instant Noodles",
          warehouseName: "Warehouse C",
          qtyCtn: 200,
          costPerCtn: 28,
          totalCost: 5600,
          date: "2026-08-23",
          user: "Ahmed",
          supplier: "Food Imports Inc",
          notes: "Rush delivery - expedited shipping",
        },
        {
          id: "R004",
          productName: "Cooking Oil 1L",
          warehouseName: "Warehouse A",
          qtyCtn: 60,
          costPerCtn: 55,
          totalCost: 3300,
          date: "2026-08-22",
          user: "Fatima",
          supplier: "Premium Oils Ltd",
          notes: "Standard delivery",
        },
      ];

      // Filter records by user's accessible warehouse locations
      const accessibleLocations = getAccessibleLocations();
      const filteredRecords = mockRecords.filter((record) => {
        // Map warehouse name to warehouse ID for filtering
        const warehouseIdMap: Record<string, string> = {
          "Warehouse A": "w1",
          "Warehouse B": "w2",
          "Warehouse C": "w3",
        };
        const warehouseId = warehouseIdMap[record.warehouseName];
        return accessibleLocations.includes(warehouseId);
      });

      setRecords(filteredRecords);
    } catch (error) {
      console.error("Error fetching receiving history:", error);
      setFormError("Failed to load receiving history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    // Validate
    if (!formData.productId || !formData.warehouseId || !formData.qtyCtn || !formData.costPerCtn) {
      setFormError("Product, warehouse, quantity, and cost are required");
      return;
    }

    const qtyCtn = parseInt(formData.qtyCtn);
    const costPerCtn = parseFloat(formData.costPerCtn);

    if (qtyCtn <= 0) {
      setFormError("Quantity must be greater than 0");
      return;
    }

    if (costPerCtn < 0) {
      setFormError("Cost cannot be negative");
      return;
    }

    try {
      // Find product and warehouse names
      const product = PRODUCTS.find((p) => p.id === formData.productId);
      const warehouse = WAREHOUSES.find((w) => w.id === formData.warehouseId);

      // Create new record
      const newRecord: ReceivingRecord = {
        id: `R${Date.now()}`,
        productName: product?.name || "Unknown",
        warehouseName: warehouse?.name || "Unknown",
        qtyCtn,
        costPerCtn,
        totalCost: qtyCtn * costPerCtn,
        date: new Date().toISOString().split("T")[0],
        user: "Current User", // Would be from auth context
        supplier: formData.supplier || "Direct Supplier",
        notes: formData.notes,
      };

      setRecords([newRecord, ...records]);
      setSuccessMessage(
        `✓ Successfully received ${qtyCtn} CTN of ${product?.name} at ${warehouse?.name}`
      );

      // Reset form
      setFormData({
        productId: "P001",
        warehouseId: "w1",
        qtyCtn: "",
        costPerCtn: "",
        supplier: "",
        notes: "",
      });

      // Hide form and show success for 3 seconds
      setShowForm(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to receive stock");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      productId: "P001",
      warehouseId: "w1",
      qtyCtn: "",
      costPerCtn: "",
      supplier: "",
      notes: "",
    });
    setFormError("");
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Receive Stock"
        subtitle="Record incoming stock from suppliers"
        action={
          !showForm && (
            <Btn onClick={() => setShowForm(true)} variant="primary">
              + Receive Stock
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

      {/* Receiving Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Stock Receiving</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {PRODUCTS.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
                <select
                  name="warehouseId"
                  value={formData.warehouseId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {WAREHOUSES.filter((w) => getAccessibleLocations().includes(w.id)).map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (CTN)
                </label>
                <input
                  type="number"
                  name="qtyCtn"
                  value={formData.qtyCtn}
                  onChange={handleFormChange}
                  placeholder="e.g., 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost per CTN ($)
                </label>
                <input
                  type="number"
                  name="costPerCtn"
                  value={formData.costPerCtn}
                  onChange={handleFormChange}
                  placeholder="e.g., 22.50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleFormChange}
                  placeholder="e.g., Global Beverages Ltd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cost
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold">
                  ${formData.qtyCtn && formData.costPerCtn
                    ? (parseInt(formData.qtyCtn) * parseFloat(formData.costPerCtn)).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )
                    : "0.00"}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Optional notes about this delivery..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary">
                Receive Stock
              </Btn>
              <Btn type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Receiving History */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Receiving History</h3>
          <p className="text-sm text-gray-600">Recent stock receipts</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Quantity
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No receiving records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{record.productName}</td>
                    <td className="px-6 py-3 text-gray-600">{record.warehouseName}</td>
                    <td className="px-6 py-3 text-center font-semibold text-gray-900">
                      {record.qtyCtn} CTN
                    </td>
                    <td className="px-6 py-3 text-center text-gray-600">
                      ${record.costPerCtn.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      ${record.totalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-sm">{record.supplier}</td>
                    <td className="px-6 py-3 text-gray-600 text-sm">{record.date}</td>
                    <td className="px-6 py-3 text-gray-600 text-sm">{record.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Receiving;
