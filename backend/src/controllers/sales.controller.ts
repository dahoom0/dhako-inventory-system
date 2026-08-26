import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/auth";

const saleSchema = z.object({
  locationId: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
    SELECT s.*, l.name AS location_name,
           json_agg(json_build_object(
             'id', si.id, 'productId', si.product_id, 'qtyCtn', si.qty_ctn,
             'sellPricePerCtn', si.sell_price_per_ctn, 'lineRevenue', si.line_revenue,
             'lineGrossProfit', si.line_gross_profit
           )) AS items
    FROM sales s
    JOIN locations l ON l.id = s.location_id
    JOIN sale_items si ON si.sale_id = s.id
    ${where}
    GROUP BY s.id, l.name
    ORDER BY s.date DESC, s.created_at DESC
    LIMIT 500
  `, params);
  res.json({ success: true, data: rows });
}

export async function createSale(req: AuthRequest, res: Response) {
  const d = saleSchema.parse(req.body);
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: [sale] } = await client.query(
      "INSERT INTO sales (location_id, customer_id, date, created_by) VALUES ($1,$2,$3,$4) RETURNING *",
      [d.locationId, d.customerId ?? null, d.date, req.user!.userId]
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
