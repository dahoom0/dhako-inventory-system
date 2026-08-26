import { Request, Response } from "express";
import { db } from "../config/db";

interface ReceiveStockRequest {
  productId: string;
  warehouseId: string;
  qtyCtn: number;
  costPerCtn: number;
  supplier?: string;
  notes?: string;
}

// POST - Receive stock from supplier
export const receiveStock = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { productId, warehouseId, qtyCtn, costPerCtn, supplier, notes } =
      req.body as ReceiveStockRequest;
    const userId = (req as any).user.userId;

    // Validate input
    if (!productId || !warehouseId || !qtyCtn || costPerCtn === undefined) {
      await client.release();
      return res.status(400).json({
        success: false,
        error: "Missing required fields: productId, warehouseId, qtyCtn, costPerCtn",
      });
    }

    if (qtyCtn <= 0 || costPerCtn < 0) {
      await client.release();
      return res.status(400).json({
        success: false,
        error: "qtyCtn must be > 0 and costPerCtn must be >= 0",
      });
    }

    // Verify product exists
    const prodCheck = await client.query(`SELECT id FROM products WHERE id = $1`, [productId]);

    if (prodCheck.rows.length === 0) {
      await client.release();
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Verify warehouse exists and is WAREHOUSE type
    const locCheck = await client.query(
      `SELECT id, type FROM locations WHERE id = $1 AND type = 'WAREHOUSE'`,
      [warehouseId]
    );

    if (locCheck.rows.length === 0) {
      await client.release();
      return res.status(404).json({ success: false, error: "Warehouse not found" });
    }

    // Begin transaction
    await client.query("BEGIN");

    try {
      // Create stock movement (append-only ledger entry)
      const movementResult = await client.query<{ id: string; created_at: string }>(
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
         RETURNING id, created_at`,
        [
          "STOCK_RECEIVED",
          productId,
          null, // from_location_id = null (external supplier)
          warehouseId,
          qtyCtn,
          costPerCtn,
          supplier ? `Received from ${supplier}` : "Stock received from supplier",
          notes || null,
          userId,
        ]
      );

      const movementId = movementResult.rows[0].id;
      const createdAt = movementResult.rows[0].created_at;

      // Commit transaction
      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        data: {
          movementId,
          productId,
          warehouseId,
          qtyCtn,
          costPerCtn,
          totalCost: qtyCtn * costPerCtn,
          timestamp: createdAt,
          message: "Stock received successfully",
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error receiving stock:", error);
    return res.status(500).json({ success: false, error: "Failed to receive stock" });
  } finally {
    client.release();
  }
};

// GET - Get stock receiving history
export const getReceivingHistory = async (req: Request, res: Response) => {
  try {
    const warehouseId = (req.query.warehouseId as string) || "";
    const productId = (req.query.productId as string) || "";
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE sm.type = 'STOCK_RECEIVED'";
    const params: any[] = [];

    if (warehouseId) {
      whereClause += ` AND sm.to_location_id = $${params.length + 1}`;
      params.push(warehouseId);
    }

    if (productId) {
      whereClause += ` AND sm.product_id = $${params.length + 1}`;
      params.push(productId);
    }

    if (startDate) {
      whereClause += ` AND sm.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND sm.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM stock_movements sm ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / pageSize);

    // Get receiving history
    const dataParams = [...params, pageSize, offset];
    const result = await db.query<{
      id: string;
      product_name: string;
      warehouse_name: string;
      qty_ctn: string;
      cost_per_ctn: string;
      created_at: string;
      created_by_name: string;
      reason: string;
      notes: string;
    }>(
      `SELECT
        sm.id,
        p.name as product_name,
        l.name as warehouse_name,
        sm.qty_ctn,
        sm.cost_per_ctn,
        sm.created_at,
        u.name as created_by_name,
        sm.reason,
        sm.notes
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       JOIN locations l ON l.id = sm.to_location_id
       JOIN users u ON u.id = sm.created_by
       ${whereClause}
       ORDER BY sm.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const items = result.rows.map((row) => ({
      id: row.id,
      productName: row.product_name,
      warehouseName: row.warehouse_name,
      qtyCtn: parseInt(row.qty_ctn),
      costPerCtn: parseFloat(row.cost_per_ctn),
      totalCost: parseInt(row.qty_ctn) * parseFloat(row.cost_per_ctn),
      date: new Date(row.created_at),
      user: row.created_by_name,
      supplier: row.reason || "Unknown",
      notes: row.notes,
    }));

    return res.json({
      success: true,
      data: {
        data: items,
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching receiving history:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch receiving history" });
  }
};

// GET - Get warehouse receiving summary
export const getReceivingSummary = async (req: Request, res: Response) => {
  try {
    const warehouseId = (req.query.warehouseId as string) || "";
    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));

    let warehouseFilter = "";
    const params: any[] = [];

    if (warehouseId) {
      warehouseFilter = ` AND sm.to_location_id = $${params.length + 1}`;
      params.push(warehouseId);
    }

    // Get total items received in period
    const result = await db.query<{
      total_qty_ctn: string;
      total_cost: string;
      num_receipts: string;
    }>(
      `SELECT
        COUNT(*) as num_receipts,
        SUM(qty_ctn) as total_qty_ctn,
        SUM(qty_ctn * cost_per_ctn) as total_cost
       FROM stock_movements
       WHERE type = 'STOCK_RECEIVED'
       AND created_at >= now() - interval '${days} days' ${warehouseFilter}`,
      params
    );

    const summary = result.rows[0];

    return res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        numReceipts: parseInt(summary.num_receipts),
        totalQtyCtn: parseInt(summary.total_qty_ctn || "0"),
        totalCost: parseFloat(summary.total_cost || "0"),
        avgPerReceipt: parseInt(summary.num_receipts) > 0
          ? parseFloat(summary.total_cost || "0") / parseInt(summary.num_receipts)
          : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching receiving summary:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch receiving summary" });
  }
};
