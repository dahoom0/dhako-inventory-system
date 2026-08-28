import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/auth";

const expenseSchema = z.object({
  locationId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(["TRANSPORT","ELECTRICITY","RENT","STAFF","FOOD","MAINTENANCE","SUPPLIES","OTHER"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  receiptUrl: z.string().url().nullable().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  locationId: z.string().uuid().optional(),
  category: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function listExpenses(req: AuthRequest, res: Response) {
  try {
    const query = listQuerySchema.parse(req.query);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Build query with filters
    let queryStr = `
      SELECT e.id, e.location_id, e.date, e.category, e.description, e.amount, 
             e.receipt_url, e.created_by, e.created_at, l.name AS location_name
      FROM expenses e
      JOIN locations l ON l.id = e.location_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // If not ADMIN, filter by accessible locations
    if (req.user?.role !== "ADMIN") {
      if (!req.user?.locationId) {
        res.status(403).json({ success: false, error: "UNAUTHORIZED_ACCESS" });
        return;
      }
      queryStr += ` AND e.location_id = $${params.length + 1}`;
      params.push(req.user.locationId);
    } else if (query.locationId) {
      queryStr += ` AND e.location_id = $${params.length + 1}`;
      params.push(query.locationId);
    }

    // Category filter
    if (query.category) {
      queryStr += ` AND e.category = $${params.length + 1}`;
      params.push(query.category);
    }

    // Date range filters
    if (query.dateFrom) {
      queryStr += ` AND e.date >= $${params.length + 1}`;
      params.push(query.dateFrom);
    }
    if (query.dateTo) {
      queryStr += ` AND e.date <= $${params.length + 1}`;
      params.push(query.dateTo);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM (${queryStr}) as subquery`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const offset = (query.page - 1) * query.limit;
    queryStr += ` ORDER BY e.date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      });
    } else {
      console.error("Error listing expenses:", error);
      res.status(500).json({ success: false, error: "Failed to list expenses" });
    }
  }
}

export async function createExpense(req: AuthRequest, res: Response) {
  try {
    const d = expenseSchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Verify location access
    if (req.user?.role !== "ADMIN" && req.user?.locationId !== d.locationId) {
      res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_LOCATION_ACCESS",
        message: "You do not have access to this location",
      });
      return;
    }

    const { rows } = await db.query(
      `INSERT INTO expenses (location_id, date, category, description, amount, receipt_url, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) 
       RETURNING id, location_id, date, category, description, amount, receipt_url, created_by, created_at`,
      [d.locationId, d.date, d.category, d.description, d.amount, d.receiptUrl ?? null, userId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      });
    } else {
      console.error("Error creating expense:", error);
      res.status(500).json({ success: false, error: "Failed to create expense" });
    }
  }
}
