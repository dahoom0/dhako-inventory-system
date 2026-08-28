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

    // Verify location access
    if (req.user?.role !== "ADMIN" && req.user?.locationId !== data.locationId) {
      res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_LOCATION_ACCESS",
        message: "You do not have access to this location",
      });
      return;
    }

    // Only ADMIN and INVENTORY_MANAGER can create adjustments
    if (!["ADMIN", "STORE_MANAGER"].includes(req.user?.role || "")) {
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

    // For negative adjustments, verify sufficient stock exists
    if (data.qtyCtn < 0) {
      const invResult = await client.query(
        `SELECT qty_ctn FROM inventory_levels WHERE product_id = $1 AND location_id = $2`,
        [data.productId, data.locationId]
      );

      const currentQty = invResult.rows.length > 0 ? invResult.rows[0].qty_ctn : 0;
      if (currentQty + data.qtyCtn < 0) {
        await client.query("ROLLBACK");
        res.status(400).json({
          success: false,
          error: "INSUFFICIENT_STOCK",
          message: `Cannot remove ${Math.abs(data.qtyCtn)} cartons. Current stock: ${currentQty}`,
        });
        return;
      }
    }

    // Create stock movement record (append-only ledger)
    const movementResult = await client.query(
      `INSERT INTO stock_movements (
        type, product_id, to_location_id, qty_ctn, reason, notes, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, now()
      )
      RETURNING id, created_at`,
      [
        "ADJUSTMENT",
        data.productId,
        data.locationId,
        data.qtyCtn,
        data.reason,
        data.notes || null,
        userId,
      ]
    );

    const movementId = movementResult.rows[0].id;

    // Create adjustment record for audit trail
    await client.query(
      `INSERT INTO stock_adjustments (
        location_id, product_id, qty_ctn, reason, notes, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, now()
      )`,
      [data.locationId, data.productId, data.qtyCtn, data.reason, data.notes || null, userId]
    );

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

/**
 * List adjustments for a location
 */
export async function listAdjustments(req: AuthRequest, res: Response) {
  try {
    const { locationId, page = 1, limit = 25 } = req.query;
    const userId = req.user?.userId;

    if (!userId || !locationId) {
      res.status(400).json({ success: false, error: "Location ID is required" });
      return;
    }

    // Verify location access
    if (req.user?.role !== "ADMIN" && req.user?.locationId !== locationId) {
      res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_LOCATION_ACCESS",
      });
      return;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM stock_adjustments WHERE location_id = $1`,
      [locationId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const result = await db.query(
      `SELECT id, location_id, product_id, qty_ctn, reason, notes, created_by, created_at
       FROM stock_adjustments
       WHERE location_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [locationId, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        data: result.rows.map((row: any) => ({
          id: row.id,
          locationId: row.location_id,
          productId: row.product_id,
          qtyCtn: row.qty_ctn,
          reason: row.reason,
          notes: row.notes,
          createdBy: row.created_by,
          createdAt: row.created_at,
        })),
        total,
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error listing adjustments:", error);
    res.status(500).json({ success: false, error: "Failed to list adjustments" });
  }
}
