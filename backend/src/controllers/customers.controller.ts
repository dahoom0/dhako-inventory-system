import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/auth";
import { ApiError, ErrorCode } from "../middleware/errorHandler";

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
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
  const query = listQuerySchema.parse(req.query);
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }

  // Build query with filters
  let queryStr = `
    SELECT c.id, c.name, c.phone, c.email, c.location_id, c.created_at
    FROM customers c
    WHERE 1=1
  `;
  const params: any[] = [];

  // If not ADMIN, filter by accessible locations
  if (req.user?.role !== "ADMIN") {
    if (!req.user?.locationId) {
      throw new ApiError(ErrorCode.UNAUTHORIZED_ACCESS, "No location access", 403);
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
        locationId: row.location_id,
        createdAt: row.created_at,
      })),
      total,
      page: query.page,
      pageSize: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, "Customer ID is required", 400);
  }

  // Verify location access if not ADMIN
  let locationCheck = "";
  const params: any[] = [id];
  if (req.user?.role !== "ADMIN" && req.user?.locationId) {
    locationCheck = ` AND c.location_id = $${params.length + 1}`;
    params.push(req.user.locationId);
  }

  const result = await db.query(
    `SELECT id, name, phone, email, location_id, created_at
     FROM customers c
     WHERE c.id = $1${locationCheck}`,
    params
  );

  if (result.rows.length === 0) {
    throw new ApiError(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found", 404);
  }

  const row = result.rows[0];
  res.json({
    success: true,
    data: {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      locationId: row.location_id,
      createdAt: row.created_at,
    },
  });
}

/**
 * Create a new customer
 */
export async function createCustomer(req: AuthRequest, res: Response) {
  const data = createCustomerSchema.parse(req.body);
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }

  // Verify location access if not ADMIN
  if (req.user?.role !== "ADMIN" && req.user?.locationId !== data.locationId) {
    throw new ApiError(
      ErrorCode.UNAUTHORIZED_LOCATION_ACCESS,
      "You do not have access to this location",
      403
    );
  }

  const result = await db.query(
    `INSERT INTO customers (name, phone, email, location_id, created_at)
     VALUES ($1, $2, $3, $4, now())
     RETURNING id, name, phone, email, location_id, created_at`,
    [data.name, data.phone || null, data.email || null, data.locationId]
  );

  const row = result.rows[0];
  res.status(201).json({
    success: true,
    data: {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      locationId: row.location_id,
      createdAt: row.created_at,
    },
  });
}

/**
 * Update a customer
 */
export async function updateCustomer(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const data = updateCustomerSchema.parse(req.body);
  const userId = req.user?.userId;

  if (!userId || !id) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, "Customer ID is required", 400);
  }

  // Get existing customer to verify location access
  const existing = await db.query(
    `SELECT location_id FROM customers WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw new ApiError(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found", 404);
  }

  const customerLocationId = existing.rows[0].location_id;

  // Verify location access
  if (req.user?.role !== "ADMIN" && req.user?.locationId !== customerLocationId) {
    throw new ApiError(
      ErrorCode.UNAUTHORIZED_LOCATION_ACCESS,
      "You do not have access to this customer",
      403
    );
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

  if (updates.length === 0) {
    throw new ApiError(ErrorCode.INVALID_OPERATION, "No fields to update", 400);
  }

  values.push(id);

  const result = await db.query(
    `UPDATE customers
     SET ${updates.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, name, phone, email, location_id, created_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new ApiError(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found", 404);
  }

  const row = result.rows[0];
  res.json({
    success: true,
    data: {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      locationId: row.location_id,
      createdAt: row.created_at,
    },
  });
}

/**
 * Delete a customer
 */
export async function deleteCustomer(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId || !id) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, "Customer ID is required", 400);
  }

  // Get existing customer to verify location access
  const existing = await db.query(
    `SELECT location_id FROM customers WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw new ApiError(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found", 404);
  }

  // Verify location access and ADMIN only for delete
  if (req.user?.role !== "ADMIN") {
    throw new ApiError(
      ErrorCode.UNAUTHORIZED_DELETE,
      "Only admins can delete customers",
      403
    );
  }

  await db.query(`DELETE FROM customers WHERE id = $1`, [id]);

  res.json({ success: true, message: "Customer deleted successfully" });
}