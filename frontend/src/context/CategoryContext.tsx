import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { categoryApi } from "@/utils/api";

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

interface CategoryContextType {
  categories: Category[];
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryName: (id: string) => string;
  getCategory: (id: string) => Category | undefined;
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from backend on mount
  useEffect(() => {
    refreshCategories();
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("📦 Fetching categories from backend...");
      const response = await categoryApi.getCategories();
      const categoriesData = Array.isArray(response) ? response : (response?.data || []);
      console.log("✅ Categories loaded:", categoriesData.length);
      setCategories(categoriesData);
    } catch (err) {
      console.error("❌ Failed to fetch categories from backend:", err);
      setError("Failed to load categories");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (name: string) => {
    try {
      setError(null);
      const response = await categoryApi.createCategory(name);
      const newCategory = response?.data || response;
      setCategories((prev) => [...prev, newCategory]);
      console.log("✅ Category created:", newCategory.name);
    } catch (err: any) {
      const message = err.message || err.data?.error || "Failed to create category";
      console.error("❌ Failed to create category:", message);
      throw new Error(message);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, name: string) => {
    try {
      setError(null);
      const response = await categoryApi.updateCategory(id, name);
      const updatedCategory = response?.data || response;
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ...updatedCategory } : cat))
      );
      console.log("✅ Category updated:", updatedCategory.name);
    } catch (err: any) {
      const message = err.message || err.data?.error || "Failed to update category";
      console.error("❌ Failed to update category:", message);
      throw new Error(message);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      setError(null);
      await categoryApi.deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      console.log("✅ Category deleted");
    } catch (err: any) {
      const message = err.message || err.data?.error || "Failed to delete category";
      console.error("❌ Failed to delete category:", message);
      throw new Error(message);
    }
  }, []);

  const getCategoryName = useCallback(
    (id: string): string => {
      const category = categories.find((cat) => cat.id === id);
      return category?.name || id;
    },
    [categories]
  );

  const getCategory = useCallback(
    (id: string): Category | undefined => {
      return categories.find((cat) => cat.id === id);
    },
    [categories]
  );

  return (
    <CategoryContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryName,
        getCategory,
        isLoading,
        error,
        refreshCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return context;
};