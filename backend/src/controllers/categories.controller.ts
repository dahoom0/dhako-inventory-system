import { Request, Response } from "express";
import { db } from "../config/db";
import { Category } from "../models/types";

// GET all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const result = await db.query<Category & { created_at: string; updated_at: string }>(
      `SELECT id, name, created_at, updated_at
       FROM categories
       ORDER BY name ASC`
    );

    const categories = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch categories" });
  }
};

// GET single category
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query<Category & { created_at: string; updated_at: string }>(
      `SELECT id, name, created_at, updated_at
       FROM categories
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    const category = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at),
    };

    return res.json({ success: true, data: category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch category" });
  }
};

// CREATE category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, error: "Category name is required" });
    }

    const trimmedName = name.trim();

    // Check if category already exists
    const existingCheck = await db.query(`SELECT id, name FROM categories WHERE name = $1`, [trimmedName]);

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: "Category already exists" });
    }

    // Create category
    const result = await db.query<Category & { created_at: string; updated_at: string }>(
      `INSERT INTO categories (name) VALUES ($1)
       RETURNING id, name, created_at, updated_at`,
      [trimmedName]
    );

    const category = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at),
    };

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ success: false, error: "Failed to create category" });
  }
};

// UPDATE category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, error: "Category name is required" });
    }

    const trimmedName = name.trim();

    // Check if category exists
    const checkResult = await db.query(`SELECT id, name FROM categories WHERE id = $1`, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    // Check if new name already exists (excluding current category)
    const existingCheck = await db.query(
      `SELECT id FROM categories WHERE name = $1 AND id != $2`,
      [trimmedName, id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: "Category name already exists" });
    }

    // Update category
    const result = await db.query<Category & { created_at: string; updated_at: string }>(
      `UPDATE categories
       SET name = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, name, created_at, updated_at`,
      [trimmedName, id]
    );

    const category = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at),
    };

    return res.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ success: false, error: "Failed to update category" });
  }
};

// DELETE category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const checkResult = await db.query(`SELECT id, name FROM categories WHERE id = $1`, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    // Check if any products use this category
    const productCheck = await db.query(`SELECT COUNT(*) as count FROM products WHERE category = $1`, [checkResult.rows[0].name]);

    if (parseInt(productCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot delete category. Products are using this category. Please reassign or delete those products first." 
      });
    }

    // Delete category
    await db.query(`DELETE FROM categories WHERE id = $1`, [id]);

    return res.json({ 
      success: true, 
      data: { id, name: checkResult.rows[0].name, message: "Category deleted successfully" } 
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ success: false, error: "Failed to delete category" });
  }
};
