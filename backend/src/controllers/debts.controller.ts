import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/auth";
import { ApiError, ErrorCode } from "../middleware/errorHandler";

const debtSchema = z.object({
  customerId: z.string().uuid(),
  locationId: z.string().uuid(),
  saleId: z.string().uuid().nullable().optional(),
  originalAmount: z.number().positive(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  locationId: z.string().uuid().optional(),
  status: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID"]).optional(),
  customerId: z.string().uuid().optional(),
});

export async function listDebts(req: AuthRequest, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }

  // Build query with filters
  let queryStr = `
    SELECT d.id, d.customer_id, d.location_id, d.sale_id, d.original_amount, d.paid_amount,
           d.status, d.created_by, d.created_at, d.updated_at,
           c.name AS customer_name, l.name AS location_name
    FROM debts d
    JOIN customers c ON c.id = d.customer_id
    JOIN locations l ON l.id = d.location_id
    WHERE 1=1
  `;
  const params: any[] = [];

  // If not ADMIN, filter by accessible locations
  if (req.user?.role !== "ADMIN") {
    if (!req.user?.locationId) {
      throw new ApiError(ErrorCode.UNAUTHORIZED_ACCESS, "No location access", 403);
    }
    queryStr += ` AND d.location_id = $${params.length + 1}`;
    params.push(req.user.locationId);
  } else if (query.locationId) {
    queryStr += ` AND d.location_id = $${params.length + 1}`;
    params.push(query.locationId);
  }

  // Status filter
  if (query.status) {
    queryStr += ` AND d.status = $${params.length + 1}`;
    params.push(query.status);
  }

  // Customer filter
  if (query.customerId) {
    queryStr += ` AND d.customer_id = $${params.length + 1}`;
    params.push(query.customerId);
  }

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM (${queryStr}) as subquery`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results
  const offset = (query.page - 1) * query.limit;
  queryStr += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(query.limit, offset);

  const result = await db.query(queryStr, params);

  res.json({
    success: true,
    data: {
      data: result.rows,
      total,
      page: query.page,
      pageSize: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

export async function createDebt(req: AuthRequest, res: Response) {
  const d = debtSchema.parse(req.body);
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }

  // Verify location access
  if (req.user?.role !== "ADMIN" && req.user?.locationId !== d.locationId) {
    throw new ApiError(
      ErrorCode.UNAUTHORIZED_LOCATION_ACCESS,
      "You do not have access to this location",
      403
    );
  }

  const { rows } = await db.query(
    `INSERT INTO debts (customer_id, location_id, sale_id, original_amount, created_by)
     VALUES ($1,$2,$3,$4,$5) 
     RETURNING id, customer_id, location_id, sale_id, original_amount, paid_amount, status, created_by, created_at, updated_at`,
    [d.customerId, d.locationId, d.saleId ?? null, d.originalAmount, userId]
  );
  res.status(201).json({ success: true, data: rows[0] });
}

export async function recordPayment(req: AuthRequest, res: Response) {
  const { amount, notes } = paymentSchema.parse(req.body);
  const userId = req.user?.userId;
  const debtId = req.params.id;
  const client = await db.connect();

  if (!userId) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }

  try {
    await client.query("BEGIN");
    const { rows: [debt] } = await client.query("SELECT * FROM debts WHERE id = $1 FOR UPDATE", [debtId]);
    if (!debt) {
      await client.query("ROLLBACK");
      throw new ApiError(ErrorCode.DEBT_NOT_FOUND, "Debt not found", 404);
    }

    // Verify location access
    if (req.user?.role !== "ADMIN" && req.user?.locationId !== debt.location_id) {
      await client.query("ROLLBACK");
      throw new ApiError(
        ErrorCode.UNAUTHORIZED_LOCATION_ACCESS,
        "You do not have access to this debt",
        403
      );
    }

    const newPaid   = parseFloat(debt.paid_amount) + amount;
    const newStatus = newPaid >= parseFloat(debt.original_amount)
      ? "PAID"
      : "PARTIALLY_PAID";

    await client.query(
      "INSERT INTO debt_payments (debt_id, amount, notes, created_by) VALUES ($1,$2,$3,$4)",
      [debt.id, amount, notes ?? null, userId]
    );
    const { rows: [updated] } = await client.query(
      "UPDATE debts SET paid_amount = $1, status = $2, updated_at = now() WHERE id = $3 RETURNING *",
      [newPaid, newStatus, debt.id]
    );
    await client.query("COMMIT");
    res.json({ success: true, data: updated });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
