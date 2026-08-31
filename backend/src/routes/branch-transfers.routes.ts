import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  createBranchTransfer,
  getBranchTransfers,
  getBranchTransferById,
  advanceBranchTransferStatus,
} from "../controllers/branch-transfers.controller";

const router = Router();

// Everyone can view branch transfers
router.get("/", authenticate, getBranchTransfers);
router.get("/:transferId", authenticate, getBranchTransferById);

// INVENTORY_MANAGER, Store Manager and Admin can create and manage branch transfers
router.post("/", authenticate, requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"), createBranchTransfer);
router.post(
  "/:transferId/advance",
  authenticate,
  requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"),
  advanceBranchTransferStatus
);

export default router;
