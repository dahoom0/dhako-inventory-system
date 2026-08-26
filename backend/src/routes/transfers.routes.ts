import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
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

// Store Manager and Admin can create and manage transfers
router.post("/", authenticate, requireRole("ADMIN", "STORE_MANAGER"), createTransfer);
router.post(
  "/:transferId/advance",
  authenticate,
  requireRole("ADMIN", "STORE_MANAGER"),
  advanceTransferStatus
);

export default router;
