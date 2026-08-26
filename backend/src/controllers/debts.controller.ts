import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/auth";

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

export async function listDebts(req: Request, res: Response) {
  const { rows } = await db.query(`
    SELECT d.*, c.name AS customer_name, l.name AS location_name
    FROM debts d
    JOIN customers c ON c.id = d.customer_id
    JOIN locations l ON l.id = d.location_id
    ORDER BY d.created_at DESC
  `);
  res.json({ success: true, data: rows });
}

export async function createDebt(req: AuthRequest, res: Response) {
  const d = debtSchema.parse(req.body);
  const { rows } = await db.query(
    `INSERT INTO debts (customer_id, location_id, sale_id, original_amount, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [d.customerId, d.locationId, d.saleId ?? null, d.originalAmount, req.user!.userId]
  );
  res.status(201).json({ success: true, data: rows[0] });
}

export async function recordPayment(req: AuthRequest, res: Response) {
  const { amount, notes } = paymentSchema.parse(req.body);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows: [debt] } = await client.query("SELECT * FROM debts WHERE id = $1 FOR UPDATE", [req.params.id]);
    if (!debt) { res.status(404).json({ success: false, error: "Debt not found" }); return; }

    const newPaid   = parseFloat(debt.paid_amount) + amount;
    const newStatus = newPaid >= parseFloat(debt.original_amount)
      ? "PAID"
      : "PARTIALLY_PAID";

    await client.query(
      "INSERT INTO debt_payments (debt_id, amount, notes, created_by) VALUES ($1,$2,$3,$4)",
      [debt.id, amount, notes ?? null, req.user!.userId]
    );
    const { rows: [updated] } = await client.query(
      "UPDATE debts SET paid_amount = $1, status = $2, updated_at = now() WHERE id = $3 RETURNING *",
      [newPaid, newStatus, debt.id]
    );
    await client.query("COMMIT");
    res.json({ success: true, data: updated });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
