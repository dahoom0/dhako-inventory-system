import React, { useState, FormEvent } from "react";
import { Card, Btn, Th, Td } from "@/components/ui";

interface Product {
  id: string;
  name: string;
  cartoons: number;
  cartoonPrice: number;
  singlePrice: number;
  date: string;
}

interface Props {
  branchName: string;
  onBack: () => void;
}

const AddNewItem: React.FC<Props> = ({ branchName, onBack }) => {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    {
      id: "P001",
      name: "Coca Cola 330ml",
      cartoons: 24,
      cartoonPrice: 22,
      singlePrice: 1,
      date: "2026-08-01",
    },
  ]);
  const [formData, setFormData] = useState({
    name: "",
    cartoons: "",
    cartoonPrice: "",
    singlePrice: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: `P${Date.now()}`,
      name: formData.name,
      cartoons: parseInt(formData.cartoons),
      cartoonPrice: parseFloat(formData.cartoonPrice),
      singlePrice: parseFloat(formData.singlePrice),
      date: new Date().toISOString().split("T")[0],
    };
    setProducts([newProduct, ...products]);
    setFormData({ name: "", cartoons: "", cartoonPrice: "", singlePrice: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Btn onClick={onBack} variant="secondary">
          ← Back
        </Btn>
        <h2 className="text-2xl font-bold">Item Cusub (New Item)</h2>
      </div>

      {!showForm ? (
        <Btn onClick={() => setShowForm(true)} variant="primary">
          + Add New Item (Item Cusub)
        </Btn>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Add New Product to Your Inventory</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Coca Cola 330ml"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Items per Cartoon</label>
                <input
                  type="number"
                  value={formData.cartoons}
                  onChange={(e) => setFormData({ ...formData, cartoons: e.target.value })}
                  placeholder="e.g. 24"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Price per Cartoon ($)</label>
                <input
                  type="number"
                  value={formData.cartoonPrice}
                  onChange={(e) => setFormData({ ...formData, cartoonPrice: e.target.value })}
                  placeholder="e.g. 22"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Selling Price per Item ($)</label>
                <input
                  type="number"
                  value={formData.singlePrice}
                  onChange={(e) => setFormData({ ...formData, singlePrice: e.target.value })}
                  placeholder="e.g. 1.50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary">
                Save Item
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Products List */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Your Products (Alaabada Ku Jira)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <Th>Product Name</Th>
                <Th className="text-center">Per Cartoon</Th>
                <Th className="text-right">Cost/Cartoon</Th>
                <Th className="text-right">Sell/Item</Th>
                <Th>Date Added</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <Td>
                    <span className="font-semibold">{product.name}</span>
                  </Td>
                  <Td className="text-center">{product.cartoons} items</Td>
                  <Td className="text-right font-semibold">${product.cartoonPrice.toFixed(2)}</Td>
                  <Td className="text-right font-semibold" style={{ color: "#16a34a" }}>
                    ${product.singlePrice.toFixed(2)}
                  </Td>
                  <Td style={{ color: "#64748b" }}>{product.date}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AddNewItem;
