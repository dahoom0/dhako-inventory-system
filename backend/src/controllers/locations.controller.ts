import { Request, Response } from "express";
import { db } from "../config/db";
import { Location } from "../models/types";

// GET all locations (warehouses and branches) - only ACTIVE
export const getLocations = async (req: Request, res: Response) => {
  try {
    const result = await db.query<Location & { created_at: string; status: string }>(
      `SELECT 
        id, 
        name, 
        type, 
        status,
        created_at 
       FROM locations 
       WHERE status = 'ACTIVE'
       ORDER BY type ASC, name ASC`
    );

    const locations = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      createdAt: new Date(row.created_at),
    }));

    return res.json({ success: true, data: locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch locations" });
  }
};

// GET location by ID
export const getLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query<Location & { created_at: string }>(
      `SELECT 
        id, 
        name, 
        type, 
        created_at 
       FROM locations 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Location not found" });
    }

    const row = result.rows[0];
    const location = {
      id: row.id,
      name: row.name,
      type: row.type,
      createdAt: new Date(row.created_at),
    };

    return res.json({ success: true, data: location });
  } catch (error) {
    console.error("Error fetching location:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch location" });
  }
};

// GET all warehouses - only ACTIVE
export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const result = await db.query<Location & { created_at: string; status: string }>(
      `SELECT 
        id, 
        name, 
        type, 
        status,
        created_at 
       FROM locations 
       WHERE type = 'WAREHOUSE' AND status = 'ACTIVE'
       ORDER BY name ASC`
    );

    const warehouses = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      createdAt: new Date(row.created_at),
    }));

    return res.json({ success: true, data: warehouses });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch warehouses" });
  }
};

// GET all branches - only ACTIVE
export const getBranches = async (req: Request, res: Response) => {
  try {
    const result = await db.query<Location & { created_at: string; status: string }>(
      `SELECT 
        id, 
        name, 
        type, 
        status,
        created_at 
       FROM locations 
       WHERE type = 'BRANCH' AND status = 'ACTIVE'
       ORDER BY name ASC`
    );

    const branches = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      createdAt: new Date(row.created_at),
    }));

    return res.json({ success: true, data: branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch branches" });
  }
};

// CREATE a new location (warehouse or branch)
export const createLocation = async (req: Request, res: Response) => {
  try {
    const { name, type } = req.body;

    // Validate input
    if (!name || !type) {
      return res
        .status(400)
        .json({ success: false, error: "Name and type are required" });
    }

    if (!["WAREHOUSE", "BRANCH"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, error: "Type must be WAREHOUSE or BRANCH" });
    }

    // Check if location with same name already exists (among ACTIVE locations)
    const existingCheck = await db.query(
      `SELECT id FROM locations WHERE name = $1 AND status = 'ACTIVE'`,
      [name]
    );

    if (existingCheck.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, error: "Location with this name already exists" });
    }

    // Create location
    const result = await db.query<Location & { created_at: string; status: string }>(
      `INSERT INTO locations (name, type, status, created_at, updated_at) 
       VALUES ($1, $2, 'ACTIVE', now(), now()) 
       RETURNING id, name, type, status, created_at`,
      [name, type]
    );

    const row = result.rows[0];
    const location = {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      createdAt: new Date(row.created_at),
    };

    return res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error("Error creating location:", error);
    return res.status(500).json({ success: false, error: "Failed to create location" });
  }
};

// UPDATE a location
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: "Name is required" });
    }

    // Check if location exists and is ACTIVE
    const checkResult = await db.query(
      `SELECT id FROM locations WHERE id = $1 AND status = 'ACTIVE'`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Location not found" });
    }

    // Update location
    const result = await db.query<Location & { created_at: string; updated_at: string; status: string }>(
      `UPDATE locations 
       SET name = $1, updated_at = now()
       WHERE id = $2 
       RETURNING id, name, type, status, created_at, updated_at`,
      [name, id]
    );

    const row = result.rows[0];
    const location = {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return res.json({ success: true, data: location });
  } catch (error) {
    console.error("Error updating location:", error);
    return res.status(500).json({ success: false, error: "Failed to update location" });
  }
};

// DEACTIVATE a location (soft-delete) - preserves historical data
export const deactivateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if location exists and is ACTIVE
    const checkResult = await db.query(
      `SELECT id, status FROM locations WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Location not found" });
    }

    if (checkResult.rows[0].status === "INACTIVE") {
      return res.status(400).json({ success: false, error: "Location is already inactive" });
    }

    // Deactivate location (soft-delete)
    // Historical transactions remain intact, location just won't appear in active lists
    const result = await db.query<Location & { status: string; updated_at: string }>(
      `UPDATE locations 
       SET status = 'INACTIVE', updated_at = now()
       WHERE id = $1 
       RETURNING id, name, type, status, updated_at`,
      [id]
    );

    const row = result.rows[0];
    const location = {
      id: row.id,
      status: row.status,
      updatedAt: new Date(row.updated_at),
    };

    return res.json({ success: true, data: location, message: "Location deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating location:", error);
    return res.status(500).json({ success: false, error: "Failed to deactivate location" });
  }
};

// DELETE a location (hard-delete) - for complete cleanup only
export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if location exists
    const checkResult = await db.query(
      `SELECT id FROM locations WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Location not found" });
    }

    // Check if location has users assigned to it
    const userCheck = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE location_id = $1`,
      [id]
    );

    if (parseInt(userCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete location with assigned users",
      });
    }

    // Check if location has inventory/stock movements
    const stockCheck = await db.query(
      `SELECT COUNT(*) as count FROM stock_movements WHERE from_location_id = $1 OR to_location_id = $1`,
      [id]
    );

    if (parseInt(stockCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete location with stock movements. Use deactivate instead.",
      });
    }

    // Delete location (hard-delete - only allowed if no history)
    await db.query(`DELETE FROM locations WHERE id = $1`, [id]);

    return res.json({ success: true, data: { id }, message: "Location permanently deleted" });
  } catch (error) {
    console.error("Error deleting location:", error);
    return res.status(500).json({ success: false, error: "Failed to delete location" });
  }
};

// GET location statistics (inventory value, stock count, etc.)
export const getLocationStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check location exists
    const locCheck = await db.query(`SELECT type FROM locations WHERE id = $1`, [id]);

    if (locCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Location not found" });
    }

    // Get inventory stats
    const invResult = await db.query<{
      total_products: string;
      total_ctns: string;
      total_units: string;
      inventory_value: string;
    }>(
      `SELECT
        COUNT(DISTINCT il.product_id) as total_products,
        COALESCE(SUM(il.qty_ctn), 0) as total_ctns,
        COALESCE(SUM(il.qty_units), 0) as total_units,
        COALESCE(SUM(il.cost_value), 0) as inventory_value
       FROM inventory_levels il
       WHERE il.location_id = $1`,
      [id]
    );

    const stats: {
      totalProducts: number;
      totalCtns: number;
      totalUnits: number;
      inventoryValue: number;
      recentTransactions?: number;
    } = {
      totalProducts: parseInt(invResult.rows[0].total_products),
      totalCtns: parseInt(invResult.rows[0].total_ctns),
      totalUnits: parseInt(invResult.rows[0].total_units),
      inventoryValue: parseFloat(invResult.rows[0].inventory_value),
    };

    // Get recent transactions count
    const txnResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM stock_movements
       WHERE from_location_id = $1 OR to_location_id = $1`,
      [id]
    );

    stats.recentTransactions = parseInt(txnResult.rows[0].count);

    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching location stats:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch location stats" });
  }
};
