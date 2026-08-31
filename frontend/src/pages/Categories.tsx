import React, { useState, useEffect, FormEvent } from "react";
import { categoryApi } from "@/utils/api";
import { PageHeader, Btn, Card } from "@/components/ui";

interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState({ name: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setFormError("");
      const response = await categoryApi.getCategories();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setCategories(data);
      console.log("✅ Categories loaded:", data.length);
    } catch (err: any) {
      const message = err.message || "Failed to load categories";
      console.error("❌ Failed to load categories:", message);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      if (editingCategory) {
        // Update existing category
        await categoryApi.updateCategory(editingCategory.id, formData.name);
        setFormSuccess("Category updated successfully");
      } else {
        // Create new category
        await categoryApi.createCategory(formData.name);
        setFormSuccess("Category created successfully");
      }

      // Reload categories
      await loadCategories();
      handleCancel();
    } catch (err: any) {
      const message = err.message || err.data?.error || "Operation failed";
      setFormError(message);
      console.error("Error:", err);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setFormError("");
      setFormSuccess("");
      await categoryApi.deleteCategory(id);
      setFormSuccess("Category deleted successfully");
      await loadCategories();
      setDeleteConfirm(null);
    } catch (err: any) {
      const message = err.message || err.data?.error || "Failed to delete category";
      setFormError(message);
      console.error("Error deleting category:", err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: "" });
    setFormError("");
    setFormSuccess("");
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Category Management" subtitle="Loading..." />
        <div className="text-center py-8">
          <p className="text-gray-600">Loading categories from server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Category Management"
        subtitle="Manage product categories. Categories are stored in the database."
        action={
          !showForm && (
            <Btn onClick={() => { setEditingCategory(null); setFormData({ name: "" }); setShowForm(true); }} variant="primary">
              + New Category
            </Btn>
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

      {/* Category Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingCategory ? "Edit Category" : "Create New Category"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Enter category name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Btn type="submit" variant="primary">
                {editingCategory ? "Update Category" : "Create Category"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">
            All Categories ({categories.length})
          </h3>
        </div>
        {categories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No categories found</p>
            <p className="text-sm text-gray-400">
              Create your first category to organize products
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <h4 className="font-semibold text-gray-800">{category.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {category.id.slice(0, 8)}... • Created:{" "}
                    {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  {deleteConfirm === category.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Confirm?</span>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-gray-500 text-xs font-medium px-3 py-1.5 rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CategoriesPage;