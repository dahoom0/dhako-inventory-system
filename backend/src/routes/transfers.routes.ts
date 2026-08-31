import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  createTransfer,
  getTransfers,
  getTransferById,
  advanceTransferStatus,
} from "../controllers/transfers.controller";

const router = Router();

// Everyone can view transfers
router.get("/", authenticate, getTransfers);
router.get("/:transferId", authenticate, getTransferById);

// INVENTORY_MANAGER, STORE_MANAGER and Admin can create and manage transfers
router.post("/", authenticate, requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"), createTransfer);
router.post(
  "/:transferId/advance",
  authenticate,
  requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"),
  advanceTransferStatus
);

export default router;
