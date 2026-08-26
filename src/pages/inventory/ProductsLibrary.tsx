import React, { useState, FormEvent } from "react";
import { useLocations } from "@/context/LocationContext";
import { Card, Btn, Th, Td } from "@/components/ui";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  itemsPerCtn: number;
  costPerCtn: number;
  sellPerItem: number;
  minStock: number;
  storedAt: string; // warehouse or branch ID
  lastUpdated: string;
  createdAt: string;
}

interface Props {
  onBack: () => void;
}

const CATEGORIES = [
  "Beverages",
  "Snacks",
  "Oils",
  "Dairy",
  "Grains",
  "Frozen",
  "Household",
  "Other",
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "P001",
    name: "Coca Cola 330ml",
    sku: "CC-330",
    category: "Beverages",
    itemsPerCtn: 24,
    costPerCtn: 22,
    sellPerItem: 1.5,
    minStock: 100,
    storedAt: "w1",
    lastUpdated: "2026-08-25",
    createdAt: "2026-01-15",
  },
  {
    id: "P002",
    name: "Mineral Water 600ml",
    sku: "MW-600",
    category: "Beverages",
    itemsPerCtn: 20,
    costPerCtn: 12,
    sellPerItem: 0.8,
    minStock: 80,
    storedAt: "w1",
    lastUpdated: "2026-08-24",
    createdAt: "2026-01-15",
  },
  {
    id: "P003",
    name: "Orange Juice 1L",
    sku: "OJ-1L",
    category: "Beverages",
    itemsPerCtn: 12,
    costPerCtn: 30,
    sellPerItem: 3,
    minStock: 50,
    storedAt: "w2",
    lastUpdated: "2026-08-23",
    createdAt: "2026-02-01",
  },
  {
    id: "P004",
    name: "Instant Noodles",
    sku: "IN-PKT",
    category: "Snacks",
    itemsPerCtn: 48,
    costPerCtn: 28,
    sellPerItem: 0.8,
    minStock: 200,
    storedAt: "w2",
    lastUpdated: "2026-08-25",
    createdAt: "2026-01-20",
  },
  {
    id: "P005",
    name: "Biscuits Assorted",
    sku: "BISC-250",
    category: "Snacks",
    itemsPerCtn: 20,
    costPerCtn: 35,
    sellPerItem: 2.5,
    minStock: 100,
    storedAt: "w3",
    lastUpdated: "2026-08-22",
    createdAt: "2026-01-25",
  },
  {
    id: "P006",
    name: "Cooking Oil 1L",
    sku: "CO-1L",
    category: "Oils",
    itemsPerCtn: 15,
    costPerCtn: 55,
    sellPerItem: 5,
    minStock: 40,
    storedAt: "w3",
    lastUpdated: "2026-08-20",
    createdAt: "2026-02-10",
  },
];

const ProductsLibrary: React.FC<Props> = ({ onBack }) => {
  const { locations, getLocationName } = useLocations();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    sku: "",
    category: "Beverages",
    itemsPerCtn: 24,
    costPerCtn: 0,
    sellPerItem: 0,
    minStock: 50,
    storedAt: locations[0]?.id || "w1",
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: "",
      sku: "",
      category: "Beverages",
      itemsPerCtn: 24,
      costPerCtn: 0,
      sellPerItem: 0,
      minStock: 50,
      storedAt: locations[0]?.id || "w1",
    });
    setShowForm(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setShowForm(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Update existing product
      setProducts(
        products.map((p) =>
          p.id === editingId
            ? {
                ...p,
                ...(formData as any),
                lastUpdated: new Date().toISOString().split("T")[0],
              }
            : p
        )
      );
    } else {
      // Add new product
      const newProduct: Product = {
        id: `P${Date.now()}`,
        ...(formData as any),
        lastUpdated: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString().split("T")[0],
      };
      setProducts([newProduct, ...products]);
    }

    setShowForm(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const profit = (product: Product) => {
    const profitPerItem = product.sellPerItem - product.costPerCtn / product.itemsPerCtn;
    const marginPercent = ((profitPerItem / product.sellPerItem) * 100).toFixed(0);
    return `${marginPercent}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Btn onClick={onBack} variant="secondary">
          ← Back
        </Btn>
        <h2 className="text-3xl font-bold">Products Library</h2>
      </div>

      {/* Search and Add Button */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-xs">
          <input
            type="text"
            placeholder="🔍 Search products or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {!showForm && (
          <Btn onClick={handleAddClick} variant="primary">
            + Add Product
          </Btn>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">
            {editingId ? "Edit Product" : "Add New Product"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">SKU *</label>
                <input
                  type="text"
                  value={formData.sku || ""}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Category</label>
                <select
                  value={formData.category || "Beverages"}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Items Per Cartoon *</label>
                <input
                  type="number"
                  value={formData.itemsPerCtn || 0}
                  onChange={(e) => setFormData({ ...formData, itemsPerCtn: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Cost Per Cartoon ($) *</label>
                <input
                  type="number"
                  value={formData.costPerCtn || 0}
                  onChange={(e) => setFormData({ ...formData, costPerCtn: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Selling Price Per Item ($) *</label>
                <input
                  type="number"
                  value={formData.sellPerItem || 0}
                  onChange={(e) => setFormData({ ...formData, sellPerItem: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Minimum Stock Level *</label>
                <input
                  type="number"
                  value={formData.minStock || 0}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Primary Storage Location *</label>
                <select
                  value={formData.storedAt || locations[0]?.id || "w1"}
                  onChange={(e) => setFormData({ ...formData, storedAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary">
                {editingId ? "Update Product" : "Add Product"}
              </Btn>
              <Btn
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">
            All Products ({filteredProducts.length}/{products.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <Th>Product Name</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th className="text-center">Per Ctn</Th>
                <Th className="text-right">Cost</Th>
                <Th className="text-right">Sell</Th>
                <Th className="text-center">Margin</Th>
                <Th>Stored At</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <Td colSpan={9} className="text-center py-8 text-gray-500">
                    No products found
                  </Td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Td>
                      <span className="font-semibold">{product.name}</span>
                    </Td>
                    <Td mono style={{ color: "#64748b" }}>
                      {product.sku}
                    </Td>
                    <Td>{product.category}</Td>
                    <Td className="text-center">{product.itemsPerCtn}</Td>
                    <Td className="text-right">${product.costPerCtn.toFixed(2)}</Td>
                    <Td className="text-right font-semibold" style={{ color: "#16a34a" }}>
                      ${product.sellPerItem.toFixed(2)}
                    </Td>
                    <Td className="text-center font-bold" style={{ color: "#2563eb" }}>
                      {profit(product)}
                    </Td>
                    <Td>{getLocationName(product.storedAt)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </Td>
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

export default ProductsLibrary;
