import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/auth";

const saleSchema = z.object({
  locationId: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(["CASH", "ZAAD", "OTHER"]).default("CASH"),
  paymentNote: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    qtyCtn: z.number().int().positive(),
    sellPricePerCtn: z.number().nonnegative(),
  })).min(1),
});

export async function listSales(req: Request, res: Response) {
  const locationId = req.query.locationId;
  const where = locationId ? "WHERE s.location_id = $1" : "";
  const params = locationId ? [locationId] : [];

  const { rows } = await db.query(`
    SELECT s.id, s.date, s.payment_method, s.payment_note,
           l.name AS location_name,
           json_agg(json_build_object(
             'id', si.id, 'productId', si.product_id, 'qtyCtn', si.qty_ctn,
             'sellPricePerCtn', si.sell_price_per_ctn, 'lineRevenue', si.line_revenue,
             'lineGrossProfit', si.line_gross_profit
           )) AS items,
           SUM(si.line_revenue) AS total_revenue,
           SUM(si.line_gross_profit) AS total_gross_profit
    FROM sales s
    JOIN locations l ON l.id = s.location_id
    JOIN sale_items si ON si.sale_id = s.id
    ${where}
    GROUP BY s.id, l.name
    ORDER BY s.date DESC, s.created_at DESC
    LIMIT 500
  `, params);
  res.json({
    success: true,
    data: rows.map(r => ({
      ...r,
      totalRevenue:     parseFloat(r.total_revenue     || "0"),
      totalGrossProfit: parseFloat(r.total_gross_profit || "0"),
    }))
  });
}

export async function createSale(req: AuthRequest, res: Response) {
  const d = saleSchema.parse(req.body);
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: [sale] } = await client.query(
      `INSERT INTO sales (location_id, customer_id, date, payment_method, payment_note, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [d.locationId, d.customerId ?? null, d.date,
       d.paymentMethod, d.paymentNote ?? null, req.user!.userId]
    );

    for (const item of d.items) {
      // fetch current cost as historical snapshot
      const { rows: [product] } = await client.query(
        "SELECT cost_per_ctn, qty_per_ctn FROM products WHERE id = $1", [item.productId]
      );
      if (!product) throw new Error(`Product ${item.productId} not found`);

      await client.query(
        `INSERT INTO sale_items
           (sale_id, product_id, qty_ctn, qty_units, sell_price_per_ctn, cost_per_ctn_at_sale)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [sale.id, item.productId, item.qtyCtn, item.qtyCtn * product.qty_per_ctn,
         item.sellPricePerCtn, product.cost_per_ctn]
      );

      // deduct from inventory via movement ledger
      await client.query(
        `INSERT INTO stock_movements
           (type, product_id, from_location_id, qty_ctn, cost_per_ctn, reference_id, created_by)
         VALUES ('SALE', $1, $2, $3, $4, $5, $6)`,
        [item.productId, d.locationId, item.qtyCtn, product.cost_per_ctn, sale.id, req.user!.userId]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: { saleId: sale.id } });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// DELETE /:saleId — void (cancel) a sale and restore stock
export async function voidSale(req: AuthRequest, res: Response) {
  const { saleId } = req.params;
  const client = await db.connect();
  try {
    // Get sale + items
    const saleCheck = await client.query(
      `SELECT s.id, s.location_id FROM sales s WHERE s.id = $1`,
      [saleId]
    );
    if (saleCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: "Sale not found" });
    }
    const sale = saleCheck.rows[0];

    const items = await client.query(
      `SELECT product_id, qty_ctn, cost_per_ctn_at_sale FROM sale_items WHERE sale_id = $1`,
      [saleId]
    );

    await client.query("BEGIN");

    // Restore stock — reverse the SALE movement by adding stock back
    for (const item of items.rows) {
      await client.query(
        `INSERT INTO stock_movements
           (type, product_id, to_location_id, qty_ctn, cost_per_ctn, reference_id, notes, created_by)
         VALUES ('RETURN', $1, $2, $3, $4, $5, 'Sale voided — stock restored', $6)`,
        [item.product_id, sale.location_id, item.qty_ctn,
         item.cost_per_ctn_at_sale, saleId, req.user!.userId]
      );
    }

    // Delete sale (cascades to sale_items)
    await client.query(`DELETE FROM sales WHERE id = $1`, [saleId]);

    await client.query("COMMIT");
    res.json({ success: true, data: { message: "Sale voided and stock restored" } });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("voidSale error:", e);
    res.status(500).json({ success: false, error: "Failed to void sale" });
  } finally {
    client.release();
  }
}

// PATCH /:saleId — edit sell price per item and/or payment method
export async function updateSale(req: AuthRequest, res: Response) {
  const { saleId } = req.params;
  const { paymentMethod, paymentNote, items } = req.body;
  // items: [{ productId, sellPricePerCtn }]

  const client = await db.connect();
  try {
    const saleCheck = await client.query(`SELECT id FROM sales WHERE id = $1`, [saleId]);
    if (saleCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: "Sale not found" });
    }

    await client.query("BEGIN");

    // Update payment method if provided
    if (paymentMethod) {
      await client.query(
        `UPDATE sales SET payment_method = $1, payment_note = $2 WHERE id = $3`,
        [paymentMethod, paymentNote ?? null, saleId]
      );
    }

    // Update sell prices if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `UPDATE sale_items
           SET sell_price_per_ctn = $1
           WHERE sale_id = $2 AND product_id = $3`,
          [item.sellPricePerCtn, saleId, item.productId]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, data: { message: "Sale updated" } });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("updateSale error:", e);
    res.status(500).json({ success: false, error: "Failed to update sale" });
  } finally {
    client.release();
  }
}
