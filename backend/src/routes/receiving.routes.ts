import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import {
  receiveStock,
  getReceivingHistory,
  getReceivingSummary,
} from "../controllers/receiving.controller";

const router = Router();

// Store Manager and Admin can receive stock
router.post("/", authenticate, requireRole("ADMIN", "STORE_MANAGER"), receiveStock);

// Everyone can view receiving history
router.get("/history", authenticate, getReceivingHistory);
router.get("/summary", authenticate, getReceivingSummary);

export default router;
