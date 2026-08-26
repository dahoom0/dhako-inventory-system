import { Request, Response } from "express";
import { db } from "../config/db";
import { Transfer, TransferItem, PaginatedResult } from "../models/types";

// POST - Create a new transfer
export const createTransfer = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { fromLocationId, toLocationId, items } = req.body;
    const userId = (req as any).user.userId;

    // Validate input
    if (!fromLocationId || !toLocationId || !items || items.length === 0) {
      await client.release();
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fromLocationId, toLocationId, items",
      });
    }

    if (fromLocationId === toLocationId) {
      await client.release();
      return res.status(400).json({
        success: false,
        error: "Source and destination locations must be different",
      });
    }

    // Verify both locations exist
    const locCheck = await client.query(
      `SELECT id FROM locations WHERE id = $1 OR id = $2`,
      [fromLocationId, toLocationId]
    );

    if (locCheck.rows.length !== 2) {
      await client.release();
      return res.status(404).json({ success: false, error: "One or both locations not found" });
    }

    // Begin transaction
    await client.query("BEGIN");

    try {
      // Validate all products exist and have sufficient stock
      for (const item of items) {
        // Check product exists
        const prodCheck = await client.query(`SELECT id FROM products WHERE id = $1`, [
          item.productId,
        ]);

        if (prodCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          await client.release();
          return res.status(404).json({
            success: false,
            error: `Product ${item.productId} not found`,
          });
        }

        // Check sufficient stock at source location
        const stockCheck = await client.query<{ qty_ctn: string }>(
          `SELECT COALESCE(qty_ctn, 0) as qty_ctn
           FROM inventory_levels
           WHERE product_id = $1 AND location_id = $2`,
          [item.productId, fromLocationId]
        );

        const availableStock = parseInt(stockCheck.rows[0]?.qty_ctn || "0");

        if (availableStock < item.qtyCtn) {
          await client.query("ROLLBACK");
          await client.release();
          return res.status(409).json({
            success: false,
            error: `Insufficient stock for product ${item.productId}. Available: ${availableStock}, Requested: ${item.qtyCtn}`,
          });
        }
      }

      // Create transfer record
      const transferResult = await client.query<{ id: string; created_at: string }>(
        `INSERT INTO transfers (
          from_location_id,
          to_location_id,
          status,
          requested_by,
          created_at
        ) VALUES ($1, $2, $3, $4, now())
         RETURNING id, created_at`,
        [fromLocationId, toLocationId, "PENDING", userId]
      );

      const transferId = transferResult.rows[0].id;

      // Create transfer items
      for (const item of items) {
        await client.query(
          `INSERT INTO transfer_items (transfer_id, product_id, qty_ctn)
           VALUES ($1, $2, $3)`,
          [transferId, item.productId, item.qtyCtn]
        );
      }

      // Commit transaction
      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        data: {
          transferId,
          status: "PENDING",
          itemCount: items.length,
          timestamp: transferResult.rows[0].created_at,
          message: "Transfer created successfully",
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error creating transfer:", error);
    return res.status(500).json({ success: false, error: "Failed to create transfer" });
  } finally {
    client.release();
  }
};

// GET - List all transfers
export const getTransfers = async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || "";
    const fromLocationId = (req.query.fromLocationId as string) || "";
    const toLocationId = (req.query.toLocationId as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (status) {
      whereClause += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    if (fromLocationId) {
      whereClause += ` AND t.from_location_id = $${params.length + 1}`;
      params.push(fromLocationId);
    }

    if (toLocationId) {
      whereClause += ` AND t.to_location_id = $${params.length + 1}`;
      params.push(toLocationId);
    }

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM transfers t ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / pageSize);

    // Get transfers with location names and item count
    const dataParams = [...params, pageSize, offset];
    const result = await db.query<{
      id: string;
      from_location_name: string;
      to_location_name: string;
      status: string;
      item_count: string;
      created_by_name: string;
      created_at: string;
    }>(
      `SELECT
        t.id,
        lf.name as from_location_name,
        lt.name as to_location_name,
        t.status,
        COUNT(ti.id) as item_count,
        u.name as created_by_name,
        t.created_at
       FROM transfers t
       JOIN locations lf ON lf.id = t.from_location_id
       JOIN locations lt ON lt.id = t.to_location_id
       JOIN users u ON u.id = t.requested_by
       LEFT JOIN transfer_items ti ON ti.transfer_id = t.id
       ${whereClause}
       GROUP BY t.id, lf.name, lt.name, t.status, u.name, t.created_at
       ORDER BY t.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const transfers = result.rows.map((row) => ({
      id: row.id,
      from: row.from_location_name,
      to: row.to_location_name,
      status: row.status,
      itemCount: parseInt(row.item_count),
      createdBy: row.created_by_name,
      createdDate: new Date(row.created_at),
    }));

    const paginatedResult: PaginatedResult<any> = {
      data: transfers,
      total,
      page,
      pageSize,
      totalPages,
    };

    return res.json({ success: true, data: paginatedResult });
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch transfers" });
  }
};

// GET - Get transfer details with items
export const getTransferById = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;

    // Get transfer header
    const transferResult = await db.query<{
      id: string;
      from_location_id: string;
      from_location_name: string;
      to_location_id: string;
      to_location_name: string;
      status: string;
      requested_by: string;
      requested_by_name: string;
      created_at: string;
    }>(
      `SELECT
        t.id,
        t.from_location_id,
        lf.name as from_location_name,
        t.to_location_id,
        lt.name as to_location_name,
        t.status,
        t.requested_by,
        u.name as requested_by_name,
        t.created_at
       FROM transfers t
       JOIN locations lf ON lf.id = t.from_location_id
       JOIN locations lt ON lt.id = t.to_location_id
       JOIN users u ON u.id = t.requested_by
       WHERE t.id = $1`,
      [transferId]
    );

    if (transferResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Transfer not found" });
    }

    const transfer = transferResult.rows[0];

    // Get transfer items
    const itemsResult = await db.query<{
      id: string;
      product_id: string;
      product_name: string;
      qty_ctn: string;
    }>(
      `SELECT
        ti.id,
        ti.product_id,
        p.name as product_name,
        ti.qty_ctn
       FROM transfer_items ti
       JOIN products p ON p.id = ti.product_id
       WHERE ti.transfer_id = $1`,
      [transferId]
    );

    const items = itemsResult.rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      qtyCtn: parseInt(row.qty_ctn),
    }));

    return res.json({
      success: true,
      data: {
        id: transfer.id,
        fromLocationId: transfer.from_location_id,
        fromLocation: transfer.from_location_name,
        toLocationId: transfer.to_location_id,
        toLocation: transfer.to_location_name,
        status: transfer.status,
        requestedBy: transfer.requested_by_name,
        createdAt: new Date(transfer.created_at),
        items,
      },
    });
  } catch (error) {
    console.error("Error fetching transfer:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch transfer" });
  }
};

// POST - Advance transfer status
export const advanceTransferStatus = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { transferId } = req.params;
    const { action } = req.body;
    const userId = (req as any).user.userId;

    // Validate action
    const validActions = ["APPROVE", "SEND", "RECEIVE", "CANCEL"];
    if (!validActions.includes(action)) {
      await client.release();
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be APPROVE, SEND, RECEIVE, or CANCEL",
      });
    }

    // Get current transfer
    const transferCheck = await client.query<{ status: string }>(
      `SELECT status FROM transfers WHERE id = $1`,
      [transferId]
    );

    if (transferCheck.rows.length === 0) {
      await client.release();
      return res.status(404).json({ success: false, error: "Transfer not found" });
    }

    const currentStatus = transferCheck.rows[0].status;

    // Validate status transition
    let newStatus = currentStatus;

    if (action === "APPROVE" && currentStatus !== "PENDING") {
      await client.release();
      return res
        .status(409)
        .json({ success: false, error: "Can only approve PENDING transfers" });
    }
    if (action === "APPROVE") newStatus = "APPROVED";

    if (action === "SEND" && currentStatus !== "APPROVED") {
      await client.release();
      return res
        .status(409)
        .json({ success: false, error: "Can only send APPROVED transfers" });
    }
    if (action === "SEND") newStatus = "SENT";

    if (action === "RECEIVE" && currentStatus !== "SENT") {
      await client.release();
      return res
        .status(409)
        .json({ success: false, error: "Can only receive SENT transfers" });
    }
    if (action === "RECEIVE") newStatus = "RECEIVED";

    if (action === "CANCEL" && currentStatus === "RECEIVED") {
      await client.release();
      return res
        .status(409)
        .json({ success: false, error: "Cannot cancel RECEIVED transfers" });
    }
    if (action === "CANCEL") newStatus = "CANCELLED";

    // Begin transaction
    await client.query("BEGIN");

    try {
      // Get transfer details for ledger creation
      const transferDetails = await client.query<{
        from_location_id: string;
        to_location_id: string;
      }>(
        `SELECT from_location_id, to_location_id FROM transfers WHERE id = $1`,
        [transferId]
      );

      const { from_location_id, to_location_id } = transferDetails.rows[0];

      // Update transfer status
      const updateField =
        action === "APPROVE"
          ? "approved_by"
          : action === "SEND"
            ? "sent_at"
            : action === "RECEIVE"
              ? "received_at"
              : null;

      if (updateField) {
        await client.query(
          `UPDATE transfers 
           SET status = $1, ${updateField} = now()
           WHERE id = $2`,
          [newStatus, transferId]
        );
      } else {
        await client.query(`UPDATE transfers SET status = $1 WHERE id = $2`, [newStatus, transferId]);
      }

      // If RECEIVE, create stock movements for all transfer items
      if (action === "RECEIVE") {
        const items = await client.query<{
          product_id: string;
          qty_ctn: string;
        }>(
          `SELECT product_id, qty_ctn FROM transfer_items WHERE transfer_id = $1`,
          [transferId]
        );

        for (const item of items.rows) {
          // Get current cost for the product
          const productCost = await client.query<{ cost_per_ctn: string }>(
            `SELECT cost_per_ctn FROM products WHERE id = $1`,
            [item.product_id]
          );

          const costPerCtn = parseFloat(productCost.rows[0].cost_per_ctn);

          // Create outbound movement from source
          await client.query(
            `INSERT INTO stock_movements (
              type, product_id, from_location_id, to_location_id,
              qty_ctn, cost_per_ctn, reference_id, reason, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              "WAREHOUSE_TRANSFER",
              item.product_id,
              from_location_id,
              to_location_id,
              -parseInt(item.qty_ctn),
              costPerCtn,
              transferId,
              "Warehouse transfer outbound",
              userId,
            ]
          );

          // Create inbound movement to destination
          await client.query(
            `INSERT INTO stock_movements (
              type, product_id, from_location_id, to_location_id,
              qty_ctn, cost_per_ctn, reference_id, reason, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              "WAREHOUSE_TRANSFER",
              item.product_id,
              from_location_id,
              to_location_id,
              parseInt(item.qty_ctn),
              costPerCtn,
              transferId,
              "Warehouse transfer inbound",
              userId,
            ]
          );
        }
      }

      // Commit transaction
      await client.query("COMMIT");

      return res.json({
        success: true,
        data: {
          transferId,
          status: newStatus,
          message: `Transfer ${action.toLowerCase()} successful`,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error advancing transfer status:", error);
    return res.status(500).json({ success: false, error: "Failed to update transfer status" });
  } finally {
    client.release();
  }
};
