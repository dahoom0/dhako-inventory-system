import { Request, Response } from "express";
import { db } from "../config/db";
import { InventoryLevel, PaginatedResult } from "../models/types";

// GET full inventory matrix (all products × all locations)
export const getInventoryMatrix = async (req: Request, res: Response) => {
  try {
    const result = await db.query<{
      product_id: string;
      product_name: string;
      location_id: string;
      location_name: string;
      location_type: string;
      qty_ctn: string;
      qty_units: string;
      cost_value: string;
    }>(
      `SELECT
        il.product_id,
        p.name as product_name,
        il.location_id,
        l.name as location_name,
        l.type as location_type,
        il.qty_ctn,
        il.qty_units,
        il.cost_value
       FROM inventory_levels il
       JOIN products p ON p.id = il.product_id
       JOIN locations l ON l.id = il.location_id
       WHERE il.qty_ctn > 0
       ORDER BY l.type DESC, l.name ASC, p.name ASC`
    );

    const data = result.rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      locationId: row.location_id,
      locationName: row.location_name,
      locationType: row.location_type,
      qtyCtn: parseInt(row.qty_ctn),
      qtyUnits: parseInt(row.qty_units),
      costValue: parseFloat(row.cost_value),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching inventory matrix:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch inventory" });
  }
};

// GET inventory for specific warehouse
export const getWarehouseInventory = async (req: Request, res: Response) => {
  try {
    const { warehouseId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    // Verify warehouse exists and is WAREHOUSE type
    const locCheck = await db.query(
      `SELECT id, type FROM locations WHERE id = $1 AND type = 'WAREHOUSE'`,
      [warehouseId]
    );

    if (locCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Warehouse not found" });
    }

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM inventory_levels
       WHERE location_id = $1 AND qty_ctn > 0`,
      [warehouseId]
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated inventory
    const result = await db.query<{
      product_id: string;
      product_name: string;
      sku: string;
      category: string;
      qty_ctn: string;
      qty_units: string;
      qty_per_ctn: string;
      cost_value: string;
    }>(
      `SELECT
        il.product_id,
        p.name as product_name,
        p.sku,
        p.category,
        il.qty_ctn,
        il.qty_units,
        p.qty_per_ctn,
        il.cost_value
       FROM inventory_levels il
       JOIN products p ON p.id = il.product_id
       WHERE il.location_id = $1 AND il.qty_ctn > 0
       ORDER BY p.name ASC
       LIMIT $2 OFFSET $3`,
      [warehouseId, pageSize, offset]
    );

    const items = result.rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      category: row.category,
      qtyCtn: parseInt(row.qty_ctn),
      qtyUnits: parseInt(row.qty_units),
      costValue: parseFloat(row.cost_value),
    }));

    const paginatedResult: PaginatedResult<any> = {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
    };

    return res.json({ success: true, data: paginatedResult });
  } catch (error) {
    console.error("Error fetching warehouse inventory:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch warehouse inventory" });
  }
};

// GET inventory for specific branch
export const getBranchInventory = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    // Verify branch exists and is BRANCH type
    const locCheck = await db.query(
      `SELECT id, type FROM locations WHERE id = $1 AND type = 'BRANCH'`,
      [branchId]
    );

    if (locCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Branch not found" });
    }

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM inventory_levels
       WHERE location_id = $1 AND qty_ctn > 0`,
      [branchId]
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated inventory
    const result = await db.query<{
      product_id: string;
      product_name: string;
      sku: string;
      qty_ctn: string;
      qty_units: string;
      qty_per_ctn: string;
      cost_value: string;
    }>(
      `SELECT
        il.product_id,
        p.name as product_name,
        p.sku,
        il.qty_ctn,
        il.qty_units,
        p.qty_per_ctn,
        il.cost_value
       FROM inventory_levels il
       JOIN products p ON p.id = il.product_id
       WHERE il.location_id = $1 AND il.qty_ctn > 0
       ORDER BY p.name ASC
       LIMIT $2 OFFSET $3`,
      [branchId, pageSize, offset]
    );

    const items = result.rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      qtyCtn: parseInt(row.qty_ctn),
      qtyUnits: parseInt(row.qty_units),
      costValue: parseFloat(row.cost_value),
    }));

    const paginatedResult: PaginatedResult<any> = {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
    };

    return res.json({ success: true, data: paginatedResult });
  } catch (error) {
    console.error("Error fetching branch inventory:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch branch inventory" });
  }
};

// GET inventory distribution for a single product across all locations
export const getProductInventoryDistribution = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    // Verify product exists
    const prodCheck = await db.query(`SELECT name FROM products WHERE id = $1`, [productId]);

    if (prodCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const productName = prodCheck.rows[0].name;

    // Get inventory per location
    const result = await db.query<{
      location_id: string;
      location_name: string;
      location_type: string;
      qty_ctn: string;
      qty_units: string;
    }>(
      `SELECT
        l.id as location_id,
        l.name as location_name,
        l.type as location_type,
        COALESCE(il.qty_ctn, 0) as qty_ctn,
        COALESCE(il.qty_units, 0) as qty_units
       FROM locations l
       LEFT JOIN inventory_levels il ON il.location_id = l.id AND il.product_id = $1
       ORDER BY l.type DESC, l.name ASC`,
      [productId]
    );

    const locations = result.rows.map((row) => ({
      locationId: row.location_id,
      locationName: row.location_name,
      locationType: row.location_type,
      qtyCtn: parseInt(row.qty_ctn),
      qtyUnits: parseInt(row.qty_units),
    }));

    // Calculate totals
    const companyTotalCtn = locations.reduce((sum, loc) => sum + loc.qtyCtn, 0);
    const companyTotalUnits = locations.reduce((sum, loc) => sum + loc.qtyUnits, 0);

    const data = {
      productId,
      productName,
      locations,
      companyTotalCtn,
      companyTotalUnits,
    };

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching product inventory distribution:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch product inventory distribution" });
  }
};

// GET low stock alerts
export const getLowStockAlerts = async (req: Request, res: Response) => {
  try {
    const locationType = (req.query.locationType as string) || "";
    const locationId = (req.query.locationId as string) || "";
    const severity = (req.query.severity as string) || "";

    let whereClause = "";
    const params: any[] = [];

    if (locationType) {
      whereClause += ` AND l.type = $${params.length + 1}`;
      params.push(locationType);
    }

    if (locationId) {
      whereClause += ` AND l.id = $${params.length + 1}`;
      params.push(locationId);
    }

    if (severity === "OUT_OF_STOCK") {
      whereClause += ` AND lsa.alert_type = 'OUT_OF_STOCK'`;
    } else if (severity === "LOW_STOCK") {
      whereClause += ` AND lsa.alert_type = 'LOW_STOCK'`;
    }

    const result = await db.query<{
      product_id: string;
      product_name: string;
      location_id: string;
      location_name: string;
      location_type: string;
      qty_ctn: string;
      min_stock_ctn: string;
      alert_type: string;
    }>(
      `SELECT
        lsa.product_id,
        lsa.product_name,
        lsa.location_id,
        lsa.location_name,
        lsa.location_type,
        lsa.qty_ctn,
        lsa.min_stock_ctn,
        lsa.alert_type
       FROM low_stock_alerts lsa
       WHERE 1=1 ${whereClause}
       ORDER BY lsa.alert_type DESC, lsa.qty_ctn ASC`,
      params
    );

    const alerts = result.rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      locationId: row.location_id,
      locationName: row.location_name,
      locationType: row.location_type,
      qtyCtn: parseInt(row.qty_ctn),
      minStockCtn: parseInt(row.min_stock_ctn),
      alertType: row.alert_type,
    }));

    return res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch low stock alerts" });
  }
};

// GET inventory movements/transaction history
export const getInventoryMovements = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
    const offset = (page - 1) * pageSize;
    const type = (req.query.type as string) || "";
    const productId = (req.query.productId as string) || "";
    const locationId = (req.query.locationId as string) || "";
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (type) {
      whereClause += ` AND sm.type = $${params.length + 1}`;
      params.push(type);
    }

    if (productId) {
      whereClause += ` AND sm.product_id = $${params.length + 1}`;
      params.push(productId);
    }

    if (locationId) {
      whereClause += ` AND (sm.from_location_id = $${params.length + 1} OR sm.to_location_id = $${params.length + 1})`;
      params.push(locationId);
      params.push(locationId);
    }

    if (startDate) {
      whereClause += ` AND sm.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND sm.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM stock_movements sm ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / pageSize);

    // Get movements
    const dataParams = [...params, pageSize, offset];
    const result = await db.query<{
      id: string;
      type: string;
      product_name: string;
      qty_ctn: string;
      from_location: string;
      to_location: string;
      created_at: string;
      created_by_name: string;
      notes: string;
    }>(
      `SELECT
        sm.id,
        sm.type,
        p.name as product_name,
        sm.qty_ctn,
        COALESCE(lf.name, 'Supplier') as from_location,
        COALESCE(lt.name, 'Customer') as to_location,
        sm.created_at,
        u.name as created_by_name,
        sm.notes
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       LEFT JOIN locations lf ON lf.id = sm.from_location_id
       LEFT JOIN locations lt ON lt.id = sm.to_location_id
       JOIN users u ON u.id = sm.created_by
       ${whereClause}
       ORDER BY sm.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const movements = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      productName: row.product_name,
      qtyCtn: parseInt(row.qty_ctn),
      fromLocation: row.from_location,
      toLocation: row.to_location,
      date: new Date(row.created_at),
      user: row.created_by_name,
      notes: row.notes,
    }));

    const paginatedResult: PaginatedResult<any> = {
      data: movements,
      total,
      page,
      pageSize,
      totalPages,
    };

    return res.json({ success: true, data: paginatedResult });
  } catch (error) {
    console.error("Error fetching inventory movements:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch inventory movements" });
  }
};

// GET current stock quantity for a product at a location
export const getStockLevel = async (req: Request, res: Response) => {
  try {
    const { productId, locationId } = req.params;

    const result = await db.query<{
      qty_ctn: string;
      qty_units: string;
      cost_value: string;
    }>(
      `SELECT
        COALESCE(qty_ctn, 0) as qty_ctn,
        COALESCE(qty_units, 0) as qty_units,
        COALESCE(cost_value, 0) as cost_value
       FROM inventory_levels
       WHERE product_id = $1 AND location_id = $2`,
      [productId, locationId]
    );

    const stockLevel = result.rows.length > 0
      ? {
          qtyCtn: parseInt(result.rows[0].qty_ctn),
          qtyUnits: parseInt(result.rows[0].qty_units),
          costValue: parseFloat(result.rows[0].cost_value),
        }
      : {
          qtyCtn: 0,
          qtyUnits: 0,
          costValue: 0,
        };

    return res.json({ success: true, data: stockLevel });
  } catch (error) {
    console.error("Error fetching stock level:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch stock level" });
  }
};
