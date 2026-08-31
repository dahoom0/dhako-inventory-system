import React, { useState, useEffect, FormEvent } from "react";
import { productApi, locationApi, categoryApi } from "@/utils/api";
import { useCategories } from "@/context/CategoryContext";
import { useLocations } from "@/context/LocationContext";
import { Card, Btn, Th, Td, PageHeader } from "@/components/ui";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  qtyPerCtn: number;
  costPerCtn: number;
  sellPerCtn: number;
  minStockCtn: number;
  status: string;
  inventory_by_location?: {
    location_id: string;
    location_name: string;
    quantity_ctns: number;
  }[];
}

interface Location {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
}

type WorkflowType = "add_stock" | "new_product" | null;

const ProductsLibrary: React.FC = () => {
  const { categories: dbCategories, isLoading: categoriesLoading } = useCategories();
  const { locations, getLocationName } = useLocations();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Workflow state
  const [workflow, setWorkflow] = useState<WorkflowType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    qtyPerCtn: 24,
    costPerCtn: 0,
    sellPerCtn: 0,
    minStockCtn: 10,
    // Stock receiving fields
    locationId: "",
    qtyCtn: 0,
    supplier: "",
    notes: "",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Get warehouses for stock receiving
  const warehouses = locations.filter((loc: Location) => loc.type === "WAREHOUSE");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📦 Loading products from backend...");
      const response = await productApi.getProducts();
      // Handle paginated response
      const productsData = response?.data || (Array.isArray(response) ? response : []);
      console.log("✅ Products loaded:", productsData.length);
      setProducts(productsData);
    } catch (err: any) {
      const message = err.message || "Failed to load products";
      console.error("❌ Failed to load products:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset form for new action
  const startNewProduct = () => {
    setWorkflow("new_product");
    setEditingId(null);
    setFormData({
      name: "",
      sku: "",
      category: dbCategories[0]?.name || "",
      qtyPerCtn: 24,
      costPerCtn: 0,
      sellPerCtn: 0,
      minStockCtn: 10,
      locationId: warehouses[0]?.id || "",
      qtyCtn: 0,
      supplier: "",
      notes: "",
    });
    setFormError("");
    setFormSuccess("");
  };

  const startAddStock = () => {
    setWorkflow("add_stock");
    setEditingId(null);
    setFormData({
      name: "",
      sku: "",
      category: "",
      qtyPerCtn: 24,
      costPerCtn: 0,
      sellPerCtn: 0,
      minStockCtn: 10,
      locationId: warehouses[0]?.id || "",
      qtyCtn: 0,
      supplier: "",
      notes: "",
    });
    setFormError("");
    setFormSuccess("");
  };

  const handleCancel = () => {
    setWorkflow(null);
    setEditingId(null);
    setFormError("");
    setFormSuccess("");
  };

  const handleNewProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.category) {
        throw new Error("Please fill in all required fields");
      }

      if (!formData.locationId) {
        throw new Error("Please select a location for initial stock");
      }

      if (formData.qtyCtn <= 0) {
        throw new Error("Initial stock quantity must be greater than 0");
      }

      // Check for duplicate SKU
      const existing = products.find(
        (p) => p.sku.toLowerCase() === formData.sku.toLowerCase()
      );
      if (existing) {
        throw new Error(`Product with SKU "${formData.sku}" already exists. Use "Add Stock" instead.`);
      }

      console.log("📦 Creating new product...");

      // Create the product
      const productResponse = await productApi.createProduct({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        unit: "unit",
        qtyPerCtn: formData.qtyPerCtn,
        costPerCtn: formData.costPerCtn,
        sellPerCtn: formData.sellPerCtn,
        minStockCtn: formData.minStockCtn,
      });

      const newProduct = productResponse?.data || productResponse;
      console.log("✅ Product created:", newProduct.name);

      // Receive initial stock
      console.log("📦 Receiving initial stock...");
      await productApi.receiveStock({
        productId: newProduct.id,
        warehouseId: formData.locationId,
        qtyCtn: formData.qtyCtn,
        costPerCtn: formData.costPerCtn,
        supplier: formData.supplier || "Initial Stock",
        notes: formData.notes || "Initial stock for new product",
      });

      console.log("✅ Initial stock received");

      setFormSuccess(`Product "${newProduct.name}" created with ${formData.qtyCtn} cartons at ${getLocationName(formData.locationId)}`);

      // Reload products
      await loadProducts();
      setWorkflow(null);
    } catch (err: any) {
      const message = err.message || err.data?.error || "Failed to create product";
      console.error("❌ Error creating product:", message);
      setFormError(message);
    }
  };

  const handleAddStockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      // Validate required fields
      if (!editingId) {
        throw new Error("Please select a product");
      }

      if (!formData.locationId) {
        throw new Error("Please select a location");
      }

      if (formData.qtyCtn <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      // Get selected product
      const selectedProduct = products.find((p) => p.id === editingId);
      if (!selectedProduct) {
        throw new Error("Product not found");
      }

      console.log("📦 Receiving stock for:", selectedProduct.name);

      // Receive stock
      await productApi.receiveStock({
        productId: editingId,
        warehouseId: formData.locationId,
        qtyCtn: formData.qtyCtn,
        costPerCtn: formData.costPerCtn || selectedProduct.costPerCtn,
        supplier: formData.supplier,
        notes: formData.notes,
      });

      console.log("✅ Stock received");

      setFormSuccess(
        `Added ${formData.qtyCtn} cartons of "${selectedProduct.name}" to ${getLocationName(formData.locationId)}`
      );

      // Reload products
      await loadProducts();
      setWorkflow(null);
      setEditingId(null);
    } catch (err: any) {
      const message = err.message || err.data?.error || "Failed to receive stock";
      console.error("❌ Error receiving stock:", message);
      setFormError(message);
    }
  };

  const handleProductSelect = (product: Product) => {
    if (workflow === "add_stock") {
      setEditingId(product.id);
      setFormData({
        ...formData,
        name: product.name,
        sku: product.sku,
        category: product.category,
        qtyPerCtn: product.qtyPerCtn,
        costPerCtn: product.costPerCtn,
        sellPerCtn: product.sellPerCtn,
        minStockCtn: product.minStockCtn,
      });
    }
  };

  const getTotalStock = (product: Product): number => {
    if (!product.inventory_by_location) return 0;
    return product.inventory_by_location.reduce((sum, inv) => sum + (inv.quantity_ctns || 0), 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Products Library" subtitle="Loading products..." />
        <div className="text-center py-12">
          <p className="text-gray-600">Loading products from database...</p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Products Library" subtitle="Error loading data" />
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Btn onClick={loadProducts} variant="primary" className="mt-4">
            Retry
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Products Library"
        subtitle={`${products.length} products loaded from database`}
        action={
          !workflow && (
            <div className="flex gap-2">
              <Btn onClick={startAddStock} variant="secondary">
                📦 Add Stock
              </Btn>
              <Btn onClick={startNewProduct} variant="primary">
                + New Product
              </Btn>
            </div>
          )
        }
      />

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ❌ {formError}
        </div>
      )}

      {formSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✅ {formSuccess}
        </div>
      )}

      {/* Workflow: Add New Product */}
      {workflow === "new_product" && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Create New Product with Initial Stock</h3>
          <form onSubmit={handleNewProductSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select category</option>
                  {dbCategories.map((cat: Category) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Items Per Carton *</label>
                <input
                  type="number"
                  value={formData.qtyPerCtn}
                  onChange={(e) => setFormData({ ...formData, qtyPerCtn: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Cost Per Carton ($) *</label>
                <input
                  type="number"
                  value={formData.costPerCtn}
                  onChange={(e) => setFormData({ ...formData, costPerCtn: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Sell Price Per Carton ($) *</label>
                <input
                  type="number"
                  value={formData.sellPerCtn}
                  onChange={(e) => setFormData({ ...formData, sellPerCtn: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Minimum Stock (cartons)</label>
                <input
                  type="number"
                  value={formData.minStockCtn}
                  onChange={(e) => setFormData({ ...formData, minStockCtn: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-blue-700">Initial Stock Location *</label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg bg-blue-50"
                  required
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((loc: Location) => (
                    <option key={loc.id} value={loc.id}>
                      🏭 {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-blue-700">Initial Stock Quantity (cartons) *</label>
                <input
                  type="number"
                  value={formData.qtyCtn}
                  onChange={(e) => setFormData({ ...formData, qtyCtn: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg bg-blue-50"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Supplier (optional)</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Btn type="submit" variant="primary">
                Create Product & Add Stock
              </Btn>
              <Btn type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Workflow: Add Stock to Existing Product */}
      {workflow === "add_stock" && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Add Stock to Existing Product</h3>

          {!editingId ? (
            <div>
              <label className="block font-semibold mb-2">Select Product *</label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      SKU: {product.sku} • Current Stock: {getTotalStock(product)} CTN
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <div className="font-semibold text-blue-800">{formData.name}</div>
                <div className="text-sm text-blue-600">SKU: {formData.sku}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2 text-blue-700">Receive Stock at Location *</label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg bg-blue-50"
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((loc: Location) => (
                      <option key={loc.id} value={loc.id}>
                        🏭 {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2 text-blue-700">Quantity (cartons) *</label>
                  <input
                    type="number"
                    value={formData.qtyCtn}
                    onChange={(e) => setFormData({ ...formData, qtyCtn: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg bg-blue-50"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Cost Per Carton ($)</label>
                  <input
                    type="number"
                    value={formData.costPerCtn}
                    onChange={(e) => setFormData({ ...formData, costPerCtn: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="0.01"
                    placeholder={`Default: $${formData.costPerCtn}`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Supplier (optional)</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Btn type="submit" variant="primary">
                  📦 Receive Stock
                </Btn>
                <Btn
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ ...formData, name: "", sku: "", category: "" });
                  }}
                >
                  Change Product
                </Btn>
                <Btn type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Btn>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Search */}
      {!workflow && (
        <div className="flex gap-4">
          <div className="flex-1 min-w-xs">
            <input
              type="text"
              placeholder="🔍 Search products or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Products Table */}
      {!workflow && (
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
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th className="text-center">Qty/CTN</Th>
                  <Th className="text-right">Cost</Th>
                  <Th className="text-right">Sell</Th>
                  <Th className="text-center">Total Stock</Th>
                  <Th>Locations</Th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <Td colSpan={8} className="text-center py-8 text-gray-500">
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
                      <Td>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                          {product.category}
                        </span>
                      </Td>
                      <Td className="text-center">{product.qtyPerCtn}</Td>
                      <Td className="text-right">${product.costPerCtn.toFixed(2)}</Td>
                      <Td className="text-right font-semibold" style={{ color: "#16a34a" }}>
                        ${product.sellPerCtn.toFixed(2)}
                      </Td>
                      <Td className="text-center">
                        <span className="font-bold" style={{ color: getTotalStock(product) > 0 ? "#16a34a" : "#dc2626" }}>
                          {getTotalStock(product)}
                        </span>
                      </Td>
                      <Td>
                        {product.inventory_by_location?.map((inv) => (
                          <div key={inv.location_id} className="text-xs">
                            {inv.location_name}: {inv.quantity_ctns} CTN
                          </div>
                        ))}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProductsLibrary;