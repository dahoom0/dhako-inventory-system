import React, { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/context/CategoryContext";
import { productApi } from "@/utils/api";
import { PageHeader, Btn, Card } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { exportProductsToExcel } from "@/utils/excelExport";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  qtyPerCtn: number;
  costPerCtn: number;
  sellPerCtn: number;
  minStockCtn: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unit: string;
  qtyPerCtn: string;
  costPerCtn: string;
  sellPerCtn: string;
  minStockCtn: string;
}

const UNITS = ["can", "bottle", "carton", "pack", "box", "bag", "tin", "unit"];

const ProductManagement: React.FC = () => {
  const { user, getAccessibleLocations } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    category: categories.length > 0 ? categories[0].name : "Other",
    unit: "can",
    qtyPerCtn: "24",
    costPerCtn: "0",
    sellPerCtn: "0",
    minStockCtn: "5",
  });

  // Only ADMIN and INVENTORY_MANAGER can manage products
  const canManageProducts = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER";

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setFormError("");
      console.log("📦 Fetching products from API...");
      const data = await productApi.getProducts();
      
      // Transform backend response to match Product interface
      const transformedProducts: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        qtyPerCtn: p.qty_per_ctn,
        costPerCtn: p.cost_per_ctn,
        sellPerCtn: p.sell_per_ctn,
        minStockCtn: p.min_stock_ctn,
        status: p.status || "ACTIVE",
        createdAt: p.created_at || new Date().toISOString(),
      }));
      
      console.log("✅ Products fetched successfully:", transformedProducts);
      setProducts(transformedProducts);
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
      setFormError(err instanceof Error ? err.message : "Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate
    if (
      !formData.name ||
      !formData.sku ||
      !formData.category ||
      !formData.unit ||
      !formData.qtyPerCtn ||
      !formData.costPerCtn ||
      !formData.sellPerCtn ||
      formData.minStockCtn === ""
    ) {
      setFormError("All fields are required");
      return;
    }

    try {
      const apiData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        unit: formData.unit,
        qty_per_ctn: parseInt(formData.qtyPerCtn),
        cost_per_ctn: parseFloat(formData.costPerCtn),
        sell_per_ctn: parseFloat(formData.sellPerCtn),
        min_stock_ctn: parseInt(formData.minStockCtn),
      };

      if (editingProduct) {
        // Update product
        console.log("📝 Updating product:", editingProduct.id);
        const updated = await productApi.updateProduct(editingProduct.id, apiData);
        
        // Transform response
        const transformedProduct: Product = {
          id: updated.id,
          name: updated.name,
          sku: updated.sku,
          category: updated.category,
          unit: updated.unit,
          qtyPerCtn: updated.qty_per_ctn,
          costPerCtn: updated.cost_per_ctn,
          sellPerCtn: updated.sell_per_ctn,
          minStockCtn: updated.min_stock_ctn,
          status: updated.status || "ACTIVE",
          createdAt: updated.created_at || new Date().toISOString(),
        };

        setProducts(
          products.map((p) => (p.id === editingProduct.id ? transformedProduct : p))
        );
        console.log("✅ Product updated successfully");
      } else {
        // Create product
        console.log("➕ Creating new product");
        const created = await productApi.createProduct(apiData);
        
        // Transform response
        const transformedProduct: Product = {
          id: created.id,
          name: created.name,
          sku: created.sku,
          category: created.category,
          unit: created.unit,
          qtyPerCtn: created.qty_per_ctn,
          costPerCtn: created.cost_per_ctn,
          sellPerCtn: created.sell_per_ctn,
          minStockCtn: created.min_stock_ctn,
          status: created.status || "ACTIVE",
          createdAt: created.created_at || new Date().toISOString(),
        };

        setProducts([...products, transformedProduct]);
        console.log("✅ Product created successfully");
      }

      setFormData({
        name: "",
        sku: "",
        category: "Beverages",
        unit: "can",
        qtyPerCtn: "24",
        costPerCtn: "0",
        sellPerCtn: "0",
        minStockCtn: "5",
      });
      setEditingProduct(null);
      setShowForm(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Operation failed";
      console.error("❌ Error:", errorMsg);
      setFormError(errorMsg);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      qtyPerCtn: product.qtyPerCtn.toString(),
      costPerCtn: product.costPerCtn.toString(),
      sellPerCtn: product.sellPerCtn.toString(),
      minStockCtn: product.minStockCtn.toString(),
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      category: categories.length > 0 ? categories[0].name : "Other",
      unit: "can",
      qtyPerCtn: "24",
      costPerCtn: "0",
      sellPerCtn: "0",
      minStockCtn: "5",
    });
    setFormError("");
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setCategoryError("Category name cannot be empty");
      return;
    }
    try {
      addCategory(newCategoryName.trim());
      setNewCategoryName("");
      setCategoryError("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to add category");
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    if (window.confirm(`Delete category "${categoryName}"? Products in this category will need to be reassigned.`)) {
      try {
        const categoryToDelete = categories.find(c => c.name === categoryName);
        if (categoryToDelete) {
          deleteCategory(categoryToDelete.id);
        }
      } catch (err) {
        setCategoryError(err instanceof Error ? err.message : "Failed to delete category");
      }
    }
  };

  const handleDeactivate = async (id: string) => {
    if (window.confirm("Are you sure you want to deactivate this product?")) {
      try {
        const product = products.find(p => p.id === id);
        if (!product) return;
        
        console.log("🔴 Deactivating product:", id);
        await productApi.updateProduct(id, { 
          name: product.name,
          sku: product.sku,
          category: product.category,
          unit: product.unit,
          qty_per_ctn: product.qtyPerCtn,
          cost_per_ctn: product.costPerCtn,
          sell_per_ctn: product.sellPerCtn,
          min_stock_ctn: product.minStockCtn,
          status: "INACTIVE"
        });
        
        setProducts(
          products.map((p) => (p.id === id ? { ...p, status: "INACTIVE" } : p))
        );
        console.log("✅ Product deactivated");
      } catch (err) {
        console.error("❌ Error deactivating product:", err);
        setFormError(err instanceof Error ? err.message : "Failed to deactivate product");
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesStatus = p.status === "ACTIVE";
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleExportProducts = () => {
    // Transform products data for export
    const exportData = filteredProducts.map((product) => ({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      qtyPerCtn: product.qtyPerCtn,
      costPerCtn: product.costPerCtn.toFixed(2),
      sellPerCtn: product.sellPerCtn.toFixed(2),
      minStockCtn: product.minStockCtn,
      status: product.status,
      createdAt: new Date(product.createdAt).toLocaleDateString(),
    }));

    exportProductsToExcel(exportData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (!canManageProducts) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#dc2626", fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Access Denied</div>
          <div style={{ color: "#64748b" }}>Only administrators and inventory managers can manage products.</div>
        </Card>
      </div>
    );
  }

  const margin = (product: Product) => {
    const cost = product.costPerCtn;
    const sell = product.sellPerCtn;
    if (sell === 0) return 0;
    return Math.round(((sell - cost) / sell) * 100);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Product Management"
        subtitle="Create and manage your product catalog"
        action={
          !showForm && !showCategoryManager && canManageProducts && (
            <div className="flex gap-2">
              <PrintButton 
                label="Download Products"
                onExport={handleExportProducts}
              />
              <Btn onClick={() => setShowCategoryManager(true)} variant="secondary">
                Manage Categories
              </Btn>
              <Btn onClick={() => setShowForm(true)} variant="primary">
                + New Product
              </Btn>
            </div>
          )
        }
      />

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {formError}
        </div>
      )}

      {/* Category Manager */}
      {showCategoryManager && (
        <Card className="p-6 border-2 border-amber-300 bg-amber-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Manage Categories</h3>
            <button
              onClick={() => setShowCategoryManager(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {categoryError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
              {categoryError}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddCategory();
                  }
                }}
              />
              <Btn onClick={handleAddCategory} variant="primary">
                Add Category
              </Btn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                  {categories.length > 1 && (
                    <button
                      onClick={() => handleDeleteCategory(cat.name)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Btn
                onClick={() => setShowCategoryManager(false)}
                variant="secondary"
              >
                Done
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {formError}
        </div>
      )}

      {/* Product Form - Always show when showForm is true */}
      {showForm && (
        <Card className="p-6 border-2 border-blue-300 bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Coca Cola 330ml"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleFormChange}
                  placeholder="e.g., CC330"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingProduct}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qty per Carton *
                </label>
                <input
                  type="number"
                  name="qtyPerCtn"
                  value={formData.qtyPerCtn}
                  onChange={handleFormChange}
                  placeholder="24"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost per Carton ($) *
                </label>
                <input
                  type="number"
                  name="costPerCtn"
                  value={formData.costPerCtn}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price per Carton ($) *
                </label>
                <input
                  type="number"
                  name="sellPerCtn"
                  value={formData.sellPerCtn}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Stock (CTN) *
                </label>
                <input
                  type="number"
                  name="minStockCtn"
                  value={formData.minStockCtn}
                  onChange={handleFormChange}
                  placeholder="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-300">
              <Btn type="submit" variant="primary">
                {editingProduct ? "Update Product" : "Add Product"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Search and Filter */}
      {!showForm && canManageProducts && (
        <>
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Products Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Sell
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Margin
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Min Stock
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          <div>
                            <p>{product.name}</p>
                            <p className="text-xs text-gray-500">{product.unit}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{product.sku}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{product.category}</td>
                        <td className="px-6 py-3 text-sm text-center text-gray-600">
                          ${product.costPerCtn}
                        </td>
                        <td className="px-6 py-3 text-sm text-center text-gray-600">
                          ${product.sellPerCtn}
                        </td>
                        <td className="px-6 py-3 text-sm text-center font-semibold text-green-600">
                          {margin(product)}%
                        </td>
                        <td className="px-6 py-3 text-sm text-center text-gray-600">
                          {product.minStockCtn} CTN
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeactivate(product.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProductManagement;
