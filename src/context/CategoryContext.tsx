import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

interface CategoryContextType {
  categories: Category[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  getCategoryName: (id: string) => string;
  getCategory: (id: string) => Category | undefined;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Mock initial categories
const INITIAL_CATEGORIES: Category[] = [
  { id: "cat_1", name: "Beverages", createdAt: "2026-01-01" },
  { id: "cat_2", name: "Food", createdAt: "2026-01-01" },
  { id: "cat_3", name: "Snacks", createdAt: "2026-01-01" },
  { id: "cat_4", name: "Cooking", createdAt: "2026-01-01" },
  { id: "cat_5", name: "Household", createdAt: "2026-01-01" },
  { id: "cat_6", name: "Personal Care", createdAt: "2026-01-01" },
  { id: "cat_7", name: "Electronics", createdAt: "2026-01-01" },
  { id: "cat_8", name: "Other", createdAt: "2026-01-01" },
];

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  const addCategory = useCallback((name: string) => {
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Category already exists");
    }
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCategory]);
  }, [categories]);

  const updateCategory = useCallback((id: string, name: string) => {
    if (categories.some(cat => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Category name already exists");
    }
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name } : cat))
    );
  }, [categories]);

  const deleteCategory = useCallback((id: string) => {
    if (categories.length <= 1) {
      throw new Error("Cannot delete the last category");
    }
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  }, [categories]);

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
