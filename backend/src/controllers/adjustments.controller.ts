import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/auth";

const createAdjustmentSchema = z.object({
  locationId: z.string().uuid("Invalid location ID"),
  productId: z.string().uuid("Invalid product ID"),
  qtyCtn: z.number().finite("Quantity must be a number"),
  reason: z.enum(["DAMAGED", "LOST", "CORRECTION", "WRITE_OFF", "INVENTORY_COUNT"], {
    errorMap: () => ({ message: "Invalid reason" }),
  }),
  notes: z.string().optional(),
});

/**
 * Create an inventory adjustment
 * Adjustments can be positive (add stock) or negative (remove stock)
 */
export async function createAdjustment(req: AuthRequest, res: Response) {
  const client = await db.connect();

  try {
    const data = createAdjustmentSchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Verify location access (ADMIN can access any location)
    const userRole = req.user?.role as string;
    if (userRole !== "ADMIN" && userRole !== "INVENTORY_MANAGER" && req.user?.locationId !== data.locationId) {
      res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_LOCATION_ACCESS",
        message: "You do not have access to this location",
      });
      return;
    }

    // Only ADMIN, INVENTORY_MANAGER and STORE_MANAGER can create adjustments
    if (!["ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"].includes(userRole)) {
      res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_ROLE",
        message: "Only admins and inventory managers can create adjustments",
      });
      return;
    }

    await client.query("BEGIN");

    // Verify location exists
    const locResult = await client.query(`SELECT id FROM locations WHERE id = $1`, [data.locationId]);
    if (locResult.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, error: "Location not found" });
      return;
    }

    // Verify product exists
    const prodResult = await client.query(`SELECT id FROM products WHERE id = $1`, [data.productId]);
    if (prodResult.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, error: "Product not found" });
      return;
    }

    // For negative adjustments (outflows), verify sufficient stock exists
    if (data.qtyCtn < 0) {
      const invResult = await client.query(
        `SELECT qty_ctn FROM inventory_levels WHERE product_id = $1 AND location_id = $2`,
        [data.productId, data.locationId]
      );
      const currentQty = invResult.rows.length > 0 ? Number(invResult.rows[0].qty_ctn) : 0;
      if (currentQty < Math.abs(data.qtyCtn)) {
        await client.query("ROLLBACK");
        res.status(400).json({
          success: false,
          error: "INSUFFICIENT_STOCK",
          message: `Cannot remove ${Math.abs(data.qtyCtn)} CTN. Current stock: ${currentQty} CTN`,
        });
        return;
      }
    }

    // Create stock movement record (append-only ledger)
    // Damage/loss/write-off: outflow from location → use from_location_id with POSITIVE qty
    // The inventory_levels view subtracts from_location_id rows automatically
    const isOutflow = data.qtyCtn < 0;
    const movementResult = await client.query(
      `INSERT INTO stock_movements (
        type,
        product_id,
        from_location_id,
        to_location_id,
        qty_ctn,
        cost_per_ctn,
        reason,
        notes,
        created_by,
        created_at
      ) VALUES (
        'ADJUSTMENT', $1, $2, $3, $4,
        (SELECT cost_per_ctn FROM products WHERE id = $1),
        $5, $6, $7, now()
      )
      RETURNING id, created_at`,
      [
        data.productId,
        isOutflow ? data.locationId : null,   // from = location when removing stock
        isOutflow ? null : data.locationId,   // to   = location when adding stock
        Math.abs(data.qtyCtn),                // always positive in the ledger
        data.reason,
        data.notes || null,
        userId,
      ]
    );

    const movementId = movementResult.rows[0].id;

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Inventory adjustment created successfully",
      data: {
        movementId,
        locationId: data.locationId,
        productId: data.productId,
        qtyCtn: data.qtyCtn,
        reason: data.reason,
        createdAt: movementResult.rows[0].created_at,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      });
    } else {
      console.error("Error creating adjustment:", error);
      res.status(500).json({ success: false, error: "Failed to create adjustment" });
    }
  } finally {
    client.release();
  }
}

export async function listAdjustments(req: AuthRequest, res: Response) {
  try {
    const { locationId, reason, page = 1, limit = 100 } = req.query;

    const pageNum  = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 100));
    const offset   = (pageNum - 1) * limitNum;

    const conditions: string[] = ["sm.type = 'ADJUSTMENT'"];
    const params: any[] = [];

    if (locationId) {
      conditions.push(`(sm.from_location_id = $${params.length + 1} OR sm.to_location_id = $${params.length + 1})`);
      params.push(locationId);
    }
    if (reason) {
      conditions.push(`sm.reason = $${params.length + 1}`);
      params.push(reason);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM stock_movements sm ${where}`, params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const result = await db.query(
      `SELECT sm.id,
              COALESCE(sm.from_location_id, sm.to_location_id) AS location_id,
              sm.product_id,
              CASE WHEN sm.from_location_id IS NOT NULL THEN -sm.qty_ctn ELSE sm.qty_ctn END AS qty_ctn,
              sm.reason,
              sm.notes,
              sm.created_by,
              sm.created_at
       FROM stock_movements sm
       ${where}
       ORDER BY sm.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        id:         row.id,
        locationId: row.location_id,
        productId:  row.product_id,
        qtyCtn:     parseInt(row.qty_ctn),
        reason:     row.reason,
        notes:      row.notes,
        createdBy:  row.created_by,
        createdAt:  row.created_at,
      })),
    });
  } catch (error) {
    console.error("Error listing adjustments:", error);
    res.status(500).json({ success: false, error: "Failed to list adjustments" });
  }
}
