import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/auth";

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  locationId: z.string().uuid("Invalid location ID"),
});

const updateCustomerSchema = createCustomerSchema.partial();

const listQuerySchema = z.object({
  locationId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

/**
 * List all customers (filtered by user's accessible locations)
 */
export async function listCustomers(req: AuthRequest, res: Response) {
  try {
    const query = listQuerySchema.parse(req.query);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Build query with filters
    let queryStr = `
      SELECT c.id, c.name, c.phone, c.email, c.address, c.notes, c.location_id, c.created_at, c.updated_at
      FROM customers c
      WHERE 1=1
    `;
    const params: any[] = [];

    // If not ADMIN, filter by accessible locations
    if (req.user?.role !== "ADMIN") {
      if (!req.user?.locationId) {
        res.status(403).json({ success: false, error: "UNAUTHORIZED_ACCESS" });
        return;
      }
      queryStr += ` AND c.location_id = $${params.length + 1}`;
      params.push(req.user.locationId);
    } else if (query.locationId) {
      queryStr += ` AND c.location_id = $${params.length + 1}`;
      params.push(query.locationId);
    }

    // Search filter
    if (query.search) {
      queryStr += ` AND (c.name ILIKE $${params.length + 1} OR c.phone ILIKE $${params.length + 1} OR c.email ILIKE $${params.length + 1})`;
      params.push(`%${query.search}%`);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM (${queryStr}) as subquery`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const offset = (query.page - 1) * query.limit;
    queryStr += ` ORDER BY c.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(query.limit, offset);

    const result = await db.query(queryStr, params);

    res.json({
      success: true,
      data: {
        data: result.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          address: row.address,
          notes: row.notes,
          locationId: row.location_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        total,
        page: query.page,
        pageSize: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      });
    } else {
      console.error("Error listing customers:", error);
      res.status(500).json({ success: false, error: "Failed to list customers" });
    }
  }
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: "Customer ID is required" });
      return;
    }

    // Verify location access if not ADMIN
    let locationCheck = "";
    const params: any[] = [id];
    if (req.user?.role !== "ADMIN" && req.user?.locationId) {
      locationCheck = ` AND c.location_id = $${params.length + 1}`;
      params.push(req.user.locationId);
    }

    const result = await db.query(
      `SELECT id, name, phone, email, address, notes, location_id, created_at, updated_at
       FROM customers c
       WHERE c.id = $1${locationCheck}`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Customer not found" });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        notes: row.notes,
        locationId: row.location_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error("Error getting customer:", error);
    res.status(500).json({ success: false, error: "Failed to get customer" });
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(req: AuthRequest, res: Response) {
  try {
    const data = createCustomerSchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Verify location access if not ADMIN
    if (req.user?.role !== "ADMIN" && req.user?.locationId !== data.locationId) {
      res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_LOCATION_ACCESS",
        message: "You do not have access to this location",
      });
      return;
    }

    const result = await db.query(
      `INSERT INTO customers (id, name, phone, email, address, notes, location_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())
       RETURNING id, name, phone, email, address, notes, location_id, created_at, updated_at`,
      [data.name, data.phone || null, data.email || null, data.address || null, data.notes || null, data.locationId]
    );

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        notes: row.notes,
        locationId: row.location_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      });
    } else {
      console.error("Error creating customer:", error);
      res.status(500).json({ success: false, error: "Failed to create customer" });
    }
  }
}

/**
 * Update a customer
 */
export async function updateCustomer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = updateCustomerSchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId || !id) {
      res.status(400).json({ success: false, error: "Customer ID is required" });
      return;
    }

    // Get existing customer to verify location access
    const existing = await db.query(
      `SELECT location_id FROM customers WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: "Customer not found" });
      return;
    }

    const customerLocationId = existing.rows[0].location_id;

    // Verify location access
    if (req.user?.role !== "ADMIN" && req.user?.locationId !== customerLocationId) {
      res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_LOCATION_ACCESS",
        message: "You do not have access to this customer",
      });
      return;
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(data.address);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    if (updates.length === 1) {
      // Only updated_at changed, nothing to update
      res.status(400).json({ success: false, error: "No fields to update" });
      return;
    }

    const result = await db.query(
      `UPDATE customers
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, name, phone, email, address, notes, location_id, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Customer not found" });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        notes: row.notes,
        locationId: row.location_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      });
    } else {
      console.error("Error updating customer:", error);
      res.status(500).json({ success: false, error: "Failed to update customer" });
    }
  }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId || !id) {
      res.status(400).json({ success: false, error: "Customer ID is required" });
      return;
    }

    // Get existing customer to verify location access
    const existing = await db.query(
      `SELECT location_id FROM customers WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: "Customer not found" });
      return;
    }

    const customerLocationId = existing.rows[0].location_id;

    // Verify location access and ADMIN only for delete
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_DELETE",
        message: "Only admins can delete customers",
      });
      return;
    }

    await db.query(`DELETE FROM customers WHERE id = $1`, [id]);

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, error: "Failed to delete customer" });
  }
}
