import { Request, Response } from "express";
import { db } from "../config/db";
import { PaginatedResult } from "../models/types";

// POST - Create a new branch transfer (warehouse to branch)
export const createBranchTransfer = async (req: Request, res: Response) => {
  const client = await db.connect();

  try {
    const { fromWarehouseId, toBranchId, items } = req.body;
    const userId = (req as any).user.userId;

    // Validate input
    if (!fromWarehouseId || !toBranchId || !items || items.length === 0) {
      await client.release();
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fromWarehouseId, toBranchId, items",
      });
    }

    // Begin transaction
    await client.query("BEGIN");

    try {
      // Verify warehouse exists and is a WAREHOUSE
      const warehouseCheck = await client.query(
        `SELECT id FROM locations WHERE id = $1 AND type = 'WAREHOUSE'`,
        [fromWarehouseId]
      );

      if (warehouseCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        await client.release();
        return res.status(404).json({ success: false, error: "Warehouse not found" });
      }

      // Verify branch exists and is a BRANCH
      const branchCheck = await client.query(
        `SELECT id FROM locations WHERE id = $1 AND type = 'BRANCH'`,
        [toBranchId]
      );

      if (branchCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        await client.release();
        return res.status(404).json({ success: false, error: "Branch not found" });
      }

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

        // Check sufficient stock at warehouse
        const stockCheck = await client.query<{ qty_ctn: string }>(
          `SELECT COALESCE(qty_ctn, 0) as qty_ctn
           FROM inventory_levels
           WHERE product_id = $1 AND location_id = $2`,
          [item.productId, fromWarehouseId]
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

      // Create branch transfer record
      const transferResult = await client.query<{ id: string; created_at: string }>(
        `INSERT INTO branch_transfers (
          from_warehouse_id,
          to_branch_id,
          status,
          requested_by,
          created_at
        ) VALUES ($1, $2, $3, $4, now())
         RETURNING id, created_at`,
        [fromWarehouseId, toBranchId, "PENDING", userId]
      );

      const transferId = transferResult.rows[0].id;

      // Create transfer items
      for (const item of items) {
        await client.query(
          `INSERT INTO branch_transfer_items (transfer_id, product_id, qty_ctn)
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
          message: "Branch transfer created successfully",
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error creating branch transfer:", error);
    return res.status(500).json({ success: false, error: "Failed to create branch transfer" });
  } finally {
    client.release();
  }
};

// GET - List all branch transfers
export const getBranchTransfers = async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || "";
    const fromWarehouseId = (req.query.fromWarehouseId as string) || "";
    const toBranchId = (req.query.toBranchId as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (status) {
      whereClause += ` AND bt.status = $${params.length + 1}`;
      params.push(status);
    }

    if (fromWarehouseId) {
      whereClause += ` AND bt.from_warehouse_id = $${params.length + 1}`;
      params.push(fromWarehouseId);
    }

    if (toBranchId) {
      whereClause += ` AND bt.to_branch_id = $${params.length + 1}`;
      params.push(toBranchId);
    }

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM branch_transfers bt ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / pageSize);

    // Get transfers with location names and item count
    const dataParams = [...params, pageSize, offset];
    const result = await db.query<{
      id: string;
      warehouse_name: string;
      branch_name: string;
      status: string;
      item_count: string;
      created_by_name: string;
      created_at: string;
    }>(
      `SELECT
        bt.id,
        lw.name as warehouse_name,
        lb.name as branch_name,
        bt.status,
        COUNT(bti.id) as item_count,
        u.name as created_by_name,
        bt.created_at
       FROM branch_transfers bt
       JOIN locations lw ON lw.id = bt.from_warehouse_id
       JOIN locations lb ON lb.id = bt.to_branch_id
       JOIN users u ON u.id = bt.requested_by
       LEFT JOIN branch_transfer_items bti ON bti.transfer_id = bt.id
       ${whereClause}
       GROUP BY bt.id, lw.name, lb.name, bt.status, u.name, bt.created_at
       ORDER BY bt.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const transfers = result.rows.map((row) => ({
      id: row.id,
      warehouse: row.warehouse_name,
      branch: row.branch_name,
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
    console.error("Error fetching branch transfers:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch branch transfers" });
  }
};

// GET - Get branch transfer details with items
export const getBranchTransferById = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;

    // Get transfer header
    const transferResult = await db.query<{
      id: string;
      from_warehouse_id: string;
      warehouse_name: string;
      to_branch_id: string;
      branch_name: string;
      status: string;
      requested_by: string;
      requested_by_name: string;
      created_at: string;
    }>(
      `SELECT
        bt.id,
        bt.from_warehouse_id,
        lw.name as warehouse_name,
        bt.to_branch_id,
        lb.name as branch_name,
        bt.status,
        bt.requested_by,
        u.name as requested_by_name,
        bt.created_at
       FROM branch_transfers bt
       JOIN locations lw ON lw.id = bt.from_warehouse_id
       JOIN locations lb ON lb.id = bt.to_branch_id
       JOIN users u ON u.id = bt.requested_by
       WHERE bt.id = $1`,
      [transferId]
    );

    if (transferResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Branch transfer not found" });
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
        bti.id,
        bti.product_id,
        p.name as product_name,
        bti.qty_ctn
       FROM branch_transfer_items bti
       JOIN products p ON p.id = bti.product_id
       WHERE bti.transfer_id = $1`,
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
        fromWarehouseId: transfer.from_warehouse_id,
        warehouse: transfer.warehouse_name,
        toBranchId: transfer.to_branch_id,
        branch: transfer.branch_name,
        status: transfer.status,
        requestedBy: transfer.requested_by_name,
        createdAt: new Date(transfer.created_at),
        items,
      },
    });
  } catch (error) {
    console.error("Error fetching branch transfer:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch branch transfer" });
  }
};

// POST - Advance branch transfer status
export const advanceBranchTransferStatus = async (req: Request, res: Response) => {
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
      `SELECT status FROM branch_transfers WHERE id = $1`,
      [transferId]
    );

    if (transferCheck.rows.length === 0) {
      await client.release();
      return res.status(404).json({ success: false, error: "Branch transfer not found" });
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
        from_warehouse_id: string;
        to_branch_id: string;
      }>(
        `SELECT from_warehouse_id, to_branch_id FROM branch_transfers WHERE id = $1`,
        [transferId]
      );

      const { from_warehouse_id, to_branch_id } = transferDetails.rows[0];

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
          `UPDATE branch_transfers 
           SET status = $1, ${updateField} = now()
           WHERE id = $2`,
          [newStatus, transferId]
        );
      } else {
        await client.query(
          `UPDATE branch_transfers SET status = $1 WHERE id = $2`,
          [newStatus, transferId]
        );
      }

      // If RECEIVE, create stock movements for all transfer items
      if (action === "RECEIVE") {
        const items = await client.query<{
          product_id: string;
          qty_ctn: string;
        }>(
          `SELECT product_id, qty_ctn FROM branch_transfer_items WHERE transfer_id = $1`,
          [transferId]
        );

        for (const item of items.rows) {
          // Get current cost for the product
          const productCost = await client.query<{ cost_per_ctn: string }>(
            `SELECT cost_per_ctn FROM products WHERE id = $1`,
            [item.product_id]
          );

          const costPerCtn = parseFloat(productCost.rows[0].cost_per_ctn);

          // Create outbound movement from warehouse
          await client.query(
            `INSERT INTO stock_movements (
              type, product_id, from_location_id, to_location_id,
              qty_ctn, cost_per_ctn, reference_id, reason, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              "BRANCH_TRANSFER",
              item.product_id,
              from_warehouse_id,
              to_branch_id,
              -parseInt(item.qty_ctn),
              costPerCtn,
              transferId,
              "Branch transfer outbound",
              userId,
            ]
          );

          // Create inbound movement to branch
          await client.query(
            `INSERT INTO stock_movements (
              type, product_id, from_location_id, to_location_id,
              qty_ctn, cost_per_ctn, reference_id, reason, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              "BRANCH_TRANSFER",
              item.product_id,
              from_warehouse_id,
              to_branch_id,
              parseInt(item.qty_ctn),
              costPerCtn,
              transferId,
              "Branch transfer inbound",
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
          message: `Branch transfer ${action.toLowerCase()} successful`,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error advancing branch transfer status:", error);
    return res.status(500).json({ success: false, error: "Failed to update branch transfer status" });
  } finally {
    client.release();
  }
};
