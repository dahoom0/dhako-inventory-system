import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  receiveStock,
  getReceivingHistory,
  getReceivingSummary,
} from "../controllers/receiving.controller";

const router = Router();

// INVENTORY_MANAGER, Store Manager and Admin can receive stock
router.post("/", authenticate, requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"), receiveStock);

// Everyone can view receiving history
router.get("/history", authenticate, getReceivingHistory);
router.get("/summary", authenticate, getReceivingSummary);

export default router;
