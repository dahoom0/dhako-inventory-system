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

export async function listExpenses(req: Request, res: Response) {
  const { rows } = await db.query(`
    SELECT e.*, l.name AS location_name
    FROM expenses e
    JOIN locations l ON l.id = e.location_id
    ORDER BY e.date DESC
    LIMIT 500
  `);
  res.json({ success: true, data: rows });
}

export async function createExpense(req: AuthRequest, res: Response) {
  const d = expenseSchema.parse(req.body);
  const { rows } = await db.query(
    `INSERT INTO expenses (location_id, date, category, description, amount, receipt_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [d.locationId, d.date, d.category, d.description, d.amount, d.receiptUrl ?? null, req.user!.userId]
  );
  res.status(201).json({ success: true, data: rows[0] });
}
