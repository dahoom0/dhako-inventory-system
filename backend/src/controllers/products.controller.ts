import { Request, Response } from "express";
import { db } from "../config/db";
import { Product, PaginatedResult } from "../models/types";

const mapRowToProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  category: row.category,
  unit: row.unit,
  qtyPerCtn: parseInt(row.qty_per_ctn),
  costPerCtn: parseFloat(row.cost_per_ctn),
  sellPerCtn: parseFloat(row.sell_per_ctn),
  minStockCtn: parseInt(row.min_stock_ctn),
  status: row.status,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// GET all products (paginated, searchable)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const status = (req.query.status as string) || "";

    const offset = (page - 1) * pageSize;

    // Build query
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (name ILIKE $${params.length + 1} OR sku ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (category) {
      whereClause += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM products ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated results
    const dataParams = [...params, pageSize, offset];
    const result = await db.query<Product & { created_at: string; updated_at: string }>(
      `SELECT
        id, name, sku, category, unit, qty_per_ctn, cost_per_ctn, sell_per_ctn, min_stock_ctn,
        status, created_at, updated_at
       FROM products
       ${whereClause}
       ORDER BY name ASC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const products = result.rows.map(mapRowToProduct);

    const paginatedResult: PaginatedResult<Product> = {
      data: products,
      total,
      page,
      pageSize,
      totalPages,
    };

    return res.json({ success: true, data: paginatedResult });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
};

// GET single product
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query<Product & { created_at: string; updated_at: string }>(
      `SELECT id, name, sku, category, unit, qty_per_ctn, cost_per_ctn, sell_per_ctn, min_stock_ctn,
              status, created_at, updated_at
       FROM products
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const product = mapRowToProduct(result.rows[0]);
    return res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch product" });
  }
};

// GET unique categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const result = await db.query<{ category: string }>(
      `SELECT DISTINCT category FROM products ORDER BY category ASC`
    );

    const categories = result.rows.map((row) => row.category);

    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch categories" });
  }
};

// CREATE product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      category,
      unit,
      qtyPerCtn,
      costPerCtn,
      sellPerCtn,
      minStockCtn,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !sku ||
      !category ||
      !unit ||
      !qtyPerCtn ||
      costPerCtn === undefined ||
      !sellPerCtn ||
      minStockCtn === undefined
    ) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    // Validate numeric fields
    if (
      isNaN(qtyPerCtn) ||
      qtyPerCtn <= 0 ||
      isNaN(costPerCtn) ||
      costPerCtn < 0 ||
      isNaN(sellPerCtn) ||
      sellPerCtn < 0 ||
      isNaN(minStockCtn) ||
      minStockCtn < 0
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid numeric values" });
    }

    // Check if SKU already exists
    const existingCheck = await db.query(`SELECT id FROM products WHERE sku = $1`, [sku]);

    if (existingCheck.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, error: "Product with this SKU already exists" });
    }

    // Create product
    const result = await db.query<Product & { created_at: string; updated_at: string }>(
      `INSERT INTO products (
        name, sku, category, unit, qty_per_ctn, 
        cost_per_ctn, sell_per_ctn, min_stock_ctn
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, sku, category, unit, qty_per_ctn, 
                 cost_per_ctn, sell_per_ctn, min_stock_ctn, status, created_at, updated_at`,
      [name, sku, category, unit, qtyPerCtn, costPerCtn, sellPerCtn, minStockCtn]
    );

    const product = mapRowToProduct(result.rows[0]);
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ success: false, error: "Failed to create product" });
  }
};

// UPDATE product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      category,
      unit,
      qtyPerCtn,
      costPerCtn,
      sellPerCtn,
      minStockCtn,
      status,
    } = req.body;

    // Check if product exists
    const checkResult = await db.query(`SELECT id FROM products WHERE id = $1`, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push(`name = $${params.length + 1}`);
      params.push(name);
    }
    if (sku !== undefined) {
      updates.push(`sku = $${params.length + 1}`);
      params.push(sku);
    }
    if (category !== undefined) {
      updates.push(`category = $${params.length + 1}`);
      params.push(category);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${params.length + 1}`);
      params.push(unit);
    }
    if (qtyPerCtn !== undefined) {
      updates.push(`qty_per_ctn = $${params.length + 1}`);
      params.push(qtyPerCtn);
    }
    if (costPerCtn !== undefined) {
      updates.push(`cost_per_ctn = $${params.length + 1}`);
      params.push(costPerCtn);
    }
    if (sellPerCtn !== undefined) {
      updates.push(`sell_per_ctn = $${params.length + 1}`);
      params.push(sellPerCtn);
    }
    if (minStockCtn !== undefined) {
      updates.push(`min_stock_ctn = $${params.length + 1}`);
      params.push(minStockCtn);
    }
    if (status !== undefined) {
      updates.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    }

    // Add updated_at and id
    updates.push(`updated_at = now()`);
    params.push(id);

    const result = await db.query<Product & { created_at: string; updated_at: string }>(
      `UPDATE products 
       SET ${updates.join(", ")}
       WHERE id = $${params.length}
       RETURNING id, name, sku, category, unit, qty_per_ctn, 
                 cost_per_ctn, sell_per_ctn, min_stock_ctn, status, created_at, updated_at`,
      params
    );

    const product = mapRowToProduct(result.rows[0]);
    return res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ success: false, error: "Failed to update product" });
  }
};

// DELETE product (soft delete - set to INACTIVE)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const checkResult = await db.query(`SELECT id FROM products WHERE id = $1`, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Soft delete: set status to INACTIVE
    await db.query(`UPDATE products SET status = 'INACTIVE', updated_at = now() WHERE id = $1`, [
      id,
    ]);

    return res.json({ success: true, data: { id, message: "Product deactivated" } });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ success: false, error: "Failed to delete product" });
  }
};
